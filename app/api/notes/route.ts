import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  supabaseAdmin,
} from "@/lib/supabase-admin";

/* ============================================================
   AUTH CLIENT
============================================================ */

function createSupabaseClientWithToken(
  token: string
) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );
}

/* ============================================================
   VERIFY USER + ORGANISATION
============================================================ */

async function verifyOrganisationMembership(
  userId: string,
  orgId: string
) {
  const admin =
    supabaseAdmin as any;

  const {
    data: profile,
    error: profileError,
  } = await admin
    .from("profiles")
    .select("organisation_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    return {
      ok: false,
      status: 500,
      error: "Unable to verify profile",
    };
  }

  if (
    !profile ||
    profile.organisation_id !== orgId
  ) {
    return {
      ok: false,
      status: 403,
      error: "Organisation mismatch",
    };
  }

  return {
    ok: true,
    status: 200,
    error: null,
  };
}

/* ============================================================
   VERIFY FOLDER
============================================================ */

async function verifyFolder(
  folderId: string | null | undefined,
  orgId: string,
  userId: string
) {
  /*
   * null / "" means:
   * remove the note from a folder.
   */
  if (!folderId) {
    return {
      ok: true,
      folderId: null,
      error: null,
      status: 200,
    };
  }

  const admin =
    supabaseAdmin as any;

  const {
    data: folder,
    error,
  } = await admin
    .from("note_folders")
    .select(
      `
        id,
        organisation_id,
        created_by,
        visibility,
        is_system
      `
    )
    .eq("id", folderId)
    .eq("organisation_id", orgId)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      folderId: null,
      error: "Unable to verify note folder",
      status: 500,
    };
  }

  if (!folder) {
    return {
      ok: false,
      folderId: null,
      error: "Folder not found",
      status: 404,
    };
  }

  /*
   * Private custom folders can only be used
   * by their creator.
   *
   * System folders and org folders can be used
   * by anyone in the organisation.
   */
  if (
    folder.visibility === "private" &&
    folder.created_by !== userId
  ) {
    return {
      ok: false,
      folderId: null,
      error: "You do not have access to this folder",
      status: 403,
    };
  }

  return {
    ok: true,
    folderId: folder.id,
    error: null,
    status: 200,
  };
}

/* ============================================================
   POST
   CREATE NOTE
============================================================ */

export async function POST(
  req: NextRequest
) {
  try {
    /* --------------------------------------------------------
       AUTH
    -------------------------------------------------------- */

    const authHeader =
      req.headers.get(
        "authorization"
      ) || "";

    const token =
      authHeader.startsWith(
        "Bearer "
      )
        ? authHeader.slice(7)
        : null;

    if (!token) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const supabase =
      createSupabaseClientWithToken(
        token
      );

    const {
      data: {
        user,
      },
      error: authError,
    } =
      await supabase.auth.getUser(
        token
      );

    if (
      authError ||
      !user
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    /* --------------------------------------------------------
       PAYLOAD
    -------------------------------------------------------- */

    const payload =
      await req.json();

    const orgId =
      payload.organisation_id;

    if (!orgId) {
      return NextResponse.json(
        {
          error:
            "Missing organisation_id",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof payload.content !==
      "string"
    ) {
      return NextResponse.json(
        {
          error:
            "Missing note content",
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       VERIFY ORGANISATION
    -------------------------------------------------------- */

    const membership =
      await verifyOrganisationMembership(
        user.id,
        orgId
      );

    if (!membership.ok) {
      return NextResponse.json(
        {
          error:
            membership.error,
        },
        {
          status:
            membership.status,
        }
      );
    }

    /* --------------------------------------------------------
       VERIFY FOLDER
    -------------------------------------------------------- */

    const folderCheck =
      await verifyFolder(
        payload.folder_id,
        orgId,
        user.id
      );

    if (!folderCheck.ok) {
      return NextResponse.json(
        {
          error:
            folderCheck.error,
        },
        {
          status:
            folderCheck.status,
        }
      );
    }

    /* --------------------------------------------------------
       BUILD NOTE
    -------------------------------------------------------- */

    const status =
      payload.status ||
      "active";

    const noteData: any = {
      user_id:
        user.id,

      organisation_id:
        orgId,

      content:
        payload.content,

      title:
        payload.title ??
        null,

      folder_id:
        folderCheck.folderId,

      note_template:
        payload.note_template ??
        "blank",

      color:
        payload.color ??
        null,

      category:
        payload.category ??
        "General",

      project:
        payload.project ??
        null,

      due_date:
        payload.due_date ??
        null,

      start_date:
        payload.start_date ??
        null,

      end_date:
        payload.end_date ??
        null,

      is_reminder:
        payload.is_reminder ??
        false,

      status,

      completed:
        payload.completed ??
        status === "done",

      is_urgent:
        payload.is_urgent ??
        false,

      visibility:
        payload.visibility ||
        "private",

      type:
        payload.type ||
        (
          [
            "todo",
            "in_progress",
            "done",
          ].includes(status)
            ? "task"
            : "note"
        ),
    };

    /* --------------------------------------------------------
       OPTIONAL ARRAYS / JSON
    -------------------------------------------------------- */

    if (
      payload.assigned_to !==
      undefined
    ) {
      noteData.assigned_to =
        payload.assigned_to;
    }

    if (
      payload.attachments !==
      undefined
    ) {
      noteData.attachments =
        payload.attachments;
    }

    /* --------------------------------------------------------
       INSERT
    -------------------------------------------------------- */

    const admin =
      supabaseAdmin as any;

    const {
      data,
      error,
    } = await admin
      .from("notes")
      .insert([
        noteData,
      ])
      .select("*")
      .maybeSingle();

    if (error) {
      console.error(
        "NOTE POST ERROR:",
        error
      );

      return NextResponse.json(
        {
          error:
            error.message ||
            "Failed to create note",

          code:
            error.code,

          details:
            error.details,

          hint:
            error.hint,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        data,
      },
      {
        status: 201,
      }
    );
  } catch (
    error: any
  ) {
    console.error(
      "NOTE POST UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Unexpected server error",
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   PUT
   UPDATE NOTE
============================================================ */

export async function PUT(
  req: NextRequest
) {
  try {
    /* --------------------------------------------------------
       AUTH
    -------------------------------------------------------- */

    const authHeader =
      req.headers.get(
        "authorization"
      ) || "";

    const token =
      authHeader.startsWith(
        "Bearer "
      )
        ? authHeader.slice(7)
        : null;

    if (!token) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const supabase =
      createSupabaseClientWithToken(
        token
      );

    const {
      data: {
        user,
      },
      error: authError,
    } =
      await supabase.auth.getUser(
        token
      );

    if (
      authError ||
      !user
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    /* --------------------------------------------------------
       PAYLOAD
    -------------------------------------------------------- */

    const payload =
      await req.json();

    const orgId =
      payload.organisation_id;

    const noteId =
      payload.id;

    if (
      !orgId ||
      !noteId
    ) {
      return NextResponse.json(
        {
          error:
            "Missing organisation_id or note id",
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       VERIFY ORGANISATION
    -------------------------------------------------------- */

    const membership =
      await verifyOrganisationMembership(
        user.id,
        orgId
      );

    if (!membership.ok) {
      return NextResponse.json(
        {
          error:
            membership.error,
        },
        {
          status:
            membership.status,
        }
      );
    }

    const admin =
      supabaseAdmin as any;

    /* --------------------------------------------------------
       VERIFY NOTE EXISTS IN ORG
    -------------------------------------------------------- */

    const {
      data: existingNote,
      error:
        existingNoteError,
    } =
      await admin
        .from("notes")
        .select(
          `
            id,
            user_id,
            organisation_id,
            visibility,
            assigned_to
          `
        )
        .eq(
          "id",
          noteId
        )
        .eq(
          "organisation_id",
          orgId
        )
        .maybeSingle();

    if (
      existingNoteError
    ) {
      return NextResponse.json(
        {
          error:
            "Unable to verify note",
        },
        {
          status: 500,
        }
      );
    }

    if (
      !existingNote
    ) {
      return NextResponse.json(
        {
          error:
            "Note not found",
        },
        {
          status: 404,
        }
      );
    }

    /* --------------------------------------------------------
       VERIFY FOLDER IF CHANGING IT
    -------------------------------------------------------- */

    let verifiedFolderId:
      | string
      | null
      | undefined =
      undefined;

    if (
      payload.folder_id !==
      undefined
    ) {
      const folderCheck =
        await verifyFolder(
          payload.folder_id,
          orgId,
          user.id
        );

      if (
        !folderCheck.ok
      ) {
        return NextResponse.json(
          {
            error:
              folderCheck.error,
          },
          {
            status:
              folderCheck.status,
          }
        );
      }

      verifiedFolderId =
        folderCheck.folderId;
    }

    /* --------------------------------------------------------
       BUILD SAFE UPDATE OBJECT
    -------------------------------------------------------- */

    const updateData: any =
      {};

    /*
     * IMPORTANT:
     * check against undefined instead of truthiness.
     *
     * This means:
     * content: ""
     * folder_id: null
     * project: null
     *
     * can all be intentionally saved.
     */

    if (
      payload.status !==
      undefined
    ) {
      updateData.status =
        payload.status;

      if (
        payload.completed ===
        undefined
      ) {
        updateData.completed =
          payload.status ===
          "done";
      }
    }

    if (
      payload.completed !==
      undefined
    ) {
      updateData.completed =
        payload.completed;
    }

    if (
      payload.content !==
      undefined
    ) {
      updateData.content =
        payload.content;
    }

    if (
      payload.title !==
      undefined
    ) {
      updateData.title =
        payload.title;
    }

    if (
      payload.color !==
      undefined
    ) {
      updateData.color =
        payload.color;
    }

    if (
      payload.category !==
      undefined
    ) {
      updateData.category =
        payload.category;
    }

    if (
      payload.project !==
      undefined
    ) {
      updateData.project =
        payload.project;
    }

    if (
      payload.due_date !==
      undefined
    ) {
      updateData.due_date =
        payload.due_date;
    }

    if (
      payload.start_date !==
      undefined
    ) {
      updateData.start_date =
        payload.start_date;
    }

    if (
      payload.end_date !==
      undefined
    ) {
      updateData.end_date =
        payload.end_date;
    }

    if (
      payload.is_reminder !==
      undefined
    ) {
      updateData.is_reminder =
        payload.is_reminder;
    }

    if (
      payload.is_urgent !==
      undefined
    ) {
      updateData.is_urgent =
        payload.is_urgent;
    }

    if (
      payload.visibility !==
      undefined
    ) {
      updateData.visibility =
        payload.visibility;
    }

    if (
      payload.assigned_to !==
      undefined
    ) {
      updateData.assigned_to =
        payload.assigned_to;
    }

    if (
      payload.attachments !==
      undefined
    ) {
      updateData.attachments =
        payload.attachments;
    }

    if (
      payload.note_template !==
      undefined
    ) {
      updateData.note_template =
        payload.note_template;
    }

    if (
      verifiedFolderId !==
      undefined
    ) {
      updateData.folder_id =
        verifiedFolderId;
    }

    if (
      payload.type !==
      undefined
    ) {
      updateData.type =
        payload.type;
    }

    /* --------------------------------------------------------
       NOTHING TO UPDATE
    -------------------------------------------------------- */

    if (
      Object.keys(
        updateData
      ).length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "No note fields supplied to update",
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       UPDATE
    -------------------------------------------------------- */

    const {
      data,
      error,
    } = await admin
      .from("notes")
      .update(
        updateData
      )
      .eq(
        "id",
        noteId
      )
      .eq(
        "organisation_id",
        orgId
      )
      .select("*")
      .maybeSingle();

    if (error) {
      console.error(
        "NOTE PUT ERROR:",
        error
      );

      return NextResponse.json(
        {
          error:
            error.message ||
            "Failed to update note",

          code:
            error.code,

          details:
            error.details,

          hint:
            error.hint,
        },
        {
          status: 500,
        }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          error:
            "Note could not be updated",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        data,
      }
    );
  } catch (
    error: any
  ) {
    console.error(
      "NOTE PUT UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Unexpected server error",
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   DELETE
============================================================ */

export async function DELETE(
  req: NextRequest
) {
  try {
    /* --------------------------------------------------------
       AUTH
    -------------------------------------------------------- */

    const authHeader =
      req.headers.get(
        "authorization"
      ) || "";

    const token =
      authHeader.startsWith(
        "Bearer "
      )
        ? authHeader.slice(7)
        : null;

    if (!token) {
      return NextResponse.json(
        {
          error:
            "Unauthorized",
        },
        {
          status:
            401,
        }
      );
    }

    const supabase =
      createSupabaseClientWithToken(
        token
      );

    const {
      data: {
        user,
      },
      error:
        authError,
    } =
      await supabase.auth.getUser(
        token
      );

    if (
      authError ||
      !user
    ) {
      return NextResponse.json(
        {
          error:
            "Unauthorized",
        },
        {
          status:
            401,
        }
      );
    }

    /* --------------------------------------------------------
       PAYLOAD
    -------------------------------------------------------- */

    const payload =
      await req.json();

    const {
      id,
      organisation_id:
        orgId,
    } =
      payload;

    if (
      !id ||
      !orgId
    ) {
      return NextResponse.json(
        {
          error:
            "Missing id or organisation_id",
        },
        {
          status:
            400,
        }
      );
    }

    /* --------------------------------------------------------
       VERIFY ORGANISATION
    -------------------------------------------------------- */

    const membership =
      await verifyOrganisationMembership(
        user.id,
        orgId
      );

    if (
      !membership.ok
    ) {
      return NextResponse.json(
        {
          error:
            membership.error,
        },
        {
          status:
            membership.status,
        }
      );
    }

    /* --------------------------------------------------------
       VERIFY NOTE
    -------------------------------------------------------- */

    const admin =
      supabaseAdmin as any;

    const {
      data:
        existingNote,

      error:
        lookupError,
    } =
      await admin
        .from(
          "notes"
        )
        .select(
          "id"
        )
        .eq(
          "id",
          id
        )
        .eq(
          "organisation_id",
          orgId
        )
        .maybeSingle();

    if (
      lookupError
    ) {
      return NextResponse.json(
        {
          error:
            "Unable to verify note",
        },
        {
          status:
            500,
        }
      );
    }

    if (
      !existingNote
    ) {
      return NextResponse.json(
        {
          error:
            "Note not found",
        },
        {
          status:
            404,
        }
      );
    }

    /* --------------------------------------------------------
       DELETE
    -------------------------------------------------------- */

    const {
      error,
    } =
      await admin
        .from(
          "notes"
        )
        .delete()
        .eq(
          "id",
          id
        )
        .eq(
          "organisation_id",
          orgId
        );

    if (
      error
    ) {
      console.error(
        "NOTE DELETE ERROR:",
        error
      );

      return NextResponse.json(
        {
          error:
            error.message ||
            "Failed to delete note",

          code:
            error.code,

          details:
            error.details,

          hint:
            error.hint,
        },
        {
          status:
            500,
        }
      );
    }

    return NextResponse.json(
      {
        success:
          true,
      }
    );
  } catch (
    error: any
  ) {
    console.error(
      "NOTE DELETE UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Unexpected server error",
      },
      {
        status:
          500,
      }
    );
  }
}