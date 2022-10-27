import { showNotificationError } from "@/utils/notification";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const Food: NextPage = () => {
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  const [food, setFood] = useState();

  // Fetch food on page load.
  useEffect(() => {
    if (!router.isReady) return;

    const id = router.query.id as string;

    fetchFood(id);
  }, [router]);

  // Fetch food from database.
  const fetchFood = async (foodId: string) => {
    try {
      const { data, error } = await supabaseClient
        .from("foods")
        .select()
        .eq("id", foodId)
        .single();

      if (error) throw error;

      setFood(data);
    } catch {
      showNotificationError("Failed to fetch food.");
    }
  };

  return (
    <div>
      <h1>Food</h1>
      <code>{JSON.stringify(food)}</code>
    </div>
  );
};

export default Food;
