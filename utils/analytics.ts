import { SupabaseClient } from "@supabase/supabase-js";
import { definitions } from "lib/database";

export type LogInfo = Omit<
  definitions["api_usage_records"],
  "id" | "called_at"
>;

export const logApiCall = async (
  supabaseClient: SupabaseClient,
  logInfo: LogInfo
) => {
  console.log("logcalled", JSON.stringify(logInfo));
  try {
    const { error: insertError } = await supabaseClient
      .from("api_usage_records")
      .insert(logInfo);

    if (insertError) throw insertError;
  } catch (error) {
    // Log failure to save analytics here.
    console.error("Failed to log API call.", error);
  }
};
