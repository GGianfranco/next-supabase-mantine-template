import type { NextPage } from "next";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { showNotificationError } from "@/utils/notification";
import { definitions } from "lib/database";

const FoodList: NextPage = () => {
  const supabaseClient = useSupabaseClient();
  const [foodList, setFoodList] = useState<definitions["foods"][]>([]);

  // Fetch food list on page load.
  useEffect(() => {
    fetchFoodList();
  }, []);

  // Fetch food list when there is a change in foods table.
  supabaseClient
    .channel("db-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "foods",
      },
      () => fetchFoodList()
    )
    .subscribe();

  // Fetch food list from database.
  const fetchFoodList = async () => {
    try {
      const { data, error } = await supabaseClient.from("foods").select();
      if (error) throw error;
      setFoodList(data);
    } catch {
      showNotificationError("Failed to fetch food list.");
    }
  };

  return (
    <div>
      <h1>Foods</h1>
      <h2>Food List</h2>

      {/* Profile fetched. */}
      {foodList && foodList.length > 0 && (
        <ul>
          {foodList.map((food) => (
            <li key={food.id}>
              <Link href={`/p/foods/${encodeURIComponent(food.id)}`}>
                <a>{food.id}</a>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* No food fetched. */}
      {!foodList || (foodList.length === 0 && <p>No food found</p>)}
    </div>
  );
};

export default FoodList;
