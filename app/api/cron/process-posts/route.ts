// The old worker only marked posts as posted without contacting the platform.
// Send legacy cron traffic through the real authenticated publishing worker.
import { GET as publish } from "../publish/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = publish;
