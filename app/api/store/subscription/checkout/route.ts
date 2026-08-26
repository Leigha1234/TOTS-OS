// ============================================================
// BUY STORE ADD-ON
// ============================================================

const handleBuyStore = async () => {
  if (storeCheckoutLoading) {
    return;
  }

  try {
    setStoreCheckoutLoading(true);
    setPageError(null);

    // ========================================================
    // GET CURRENT SESSION
    // ========================================================

    const {
      data: sessionData,
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error(
        "[STORE] Session lookup failed:",
        sessionError
      );

      throw new Error(
        "We couldn't verify your login session. Please refresh the page and try again."
      );
    }

    const session =
      sessionData.session;

    // ========================================================
    // IF SESSION IS MISSING, TRY TO REFRESH IT
    // ========================================================

    let accessToken =
      session?.access_token ||
      null;

    if (!accessToken) {
      console.warn(
        "[STORE] No access token found. Attempting session refresh."
      );

      const {
        data: refreshData,
        error: refreshError,
      } =
        await supabase.auth.refreshSession();

      if (refreshError) {
        console.error(
          "[STORE] Session refresh failed:",
          refreshError
        );
      }

      accessToken =
        refreshData.session
          ?.access_token ||
        null;
    }

    // ========================================================
    // STILL NO SESSION
    // ========================================================

    if (!accessToken) {
      throw new Error(
        "Your login session has expired. Please log out and sign back in."
      );
    }

    // ========================================================
    // DEBUG
    // ========================================================

    console.log(
      "[STORE] Starting checkout",
      {
        authenticated:
          true,

        tokenPresent:
          Boolean(
            accessToken
          ),

        organisationId:
          organisationId ||
          null,
      }
    );

    // ========================================================
    // CREATE STRIPE CHECKOUT SESSION
    // ========================================================

    const response =
      await fetch(
        "/api/store/subscription/checkout",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${accessToken}`,
          },

          cache:
            "no-store",
        }
      );

    // ========================================================
    // READ RESPONSE
    // ========================================================

    const result =
      await response
        .json()
        .catch(() => null);

    console.log(
      "[STORE] Checkout response:",
      {
        status:
          response.status,

        ok:
          response.ok,

        result,
      }
    );

    // ========================================================
    // API ERROR
    // ========================================================

    if (!response.ok) {
      if (
        response.status ===
        401
      ) {
        throw new Error(
          "Your TOTS-OS session could not be verified. Please refresh the page and try again."
        );
      }

      if (
        response.status ===
        409
      ) {
        throw new Error(
          result?.error ||
            "A Store subscription already exists for this business."
        );
      }

      throw new Error(
        result?.error ||
          result?.message ||
          `Unable to start checkout (${response.status}).`
      );
    }

    // ========================================================
    // CHECKOUT URL
    // ========================================================

    const checkoutUrl =
      result?.url ||
      result?.checkoutUrl ||
      result?.checkout_url;

    if (
      !checkoutUrl ||
      typeof checkoutUrl !==
        "string"
    ) {
      console.error(
        "[STORE] Checkout succeeded but no URL was returned:",
        result
      );

      throw new Error(
        "Stripe checkout was created but no checkout URL was returned."
      );
    }

    // ========================================================
    // REDIRECT TO STRIPE
    // ========================================================

    window.location.assign(
      checkoutUrl
    );
  } catch (error) {
    console.error(
      "Store add-on checkout error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to start Store checkout.";

    setPageError(
      message
    );
  } finally {
    setStoreCheckoutLoading(
      false
    );
  }
};