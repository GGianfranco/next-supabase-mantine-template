import { logApiCall } from "@/utils/analytics";
import rateLimit from "@/utils/rate-limit";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";

// GET

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 users per second
});

async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    // Check for rate limit first.
    try {
      await limiter.check(res, 1000, "CACHE_TOKEN"); // 1000 requests per minute
    } catch {
      return res.status(429).json({ error: "Rate limit exceeded" });
    }

    // Proceed with the API function.
    try {
      const supabaseServerClient = createServerSupabaseClient({
        req,
        res,
      });
      const {
        data: { user },
      } = await supabaseServerClient.auth.getUser();
      if (!user) throw Error("No user");

      const owner = req.query.id === user.id;

      if (owner) {
        const { data, error } = await supabaseServerClient
          .from("foods")
          .select()
          .eq("user_id", req.query.id);

        if (error) throw error;

        await logApiCall(supabaseServerClient, {
          api_name: `GET /api/p/profiles/${req.query.id}/foods`,
          called_by: user.id,
        });

        return res.status(200).json({ data });
      }

      const { data, error } = await supabaseServerClient
        .from("foods")
        .select("*")
        .eq("user_id", req.query.id)
        .eq("is_public", true);

      if (error) throw error;

      await logApiCall(supabaseServerClient, {
        api_name: `GET /api/p/profiles/${req.query.id}/foods`,
        called_by: user.id,
      });
      return res.status(200).json({ data });
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: "Internal server error." });
    }
  }
}

export default handle;
