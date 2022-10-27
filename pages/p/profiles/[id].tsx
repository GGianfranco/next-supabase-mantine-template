import { AddFoodForm } from "@/components/AddFoodForm/AddFoodForm";
import { showNotificationError } from "@/utils/notification";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { definitions } from "lib/database";
import type { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const Profile: NextPage = () => {
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  const [profile, setProfile] = useState();
  const [profileFoodList, setProfileFoodList] = useState<
    definitions["foods"][]
  >([]);
  const user = useUser();
  const isOwner = user?.id === router.query.id;

  // Fetch profile on page load.
  useEffect(() => {
    if (!router.isReady) return;

    const id = router.query.id as string;

    fetchProfile(id);
    fetchProfileFoodList(id);
  }, [router]);

  // Fetch profile food list when there is a change in foods table.
  supabaseClient
    .channel("db-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "foods",
      },
      () => fetchProfileFoodList(router.query.id as string)
    )
    .subscribe();

  // Fetch profile from database.
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabaseClient
        .from("profiles")
        .select()
        .eq("id", userId)
        .single();

      if (error) throw error;

      setProfile(data);
    } catch {
      showNotificationError("Failed to fetch profile.");
    }
  };

  // Fetch profile food list from database.
  const fetchProfileFoodList = async (userId: string) => {
    try {
      const { data, error } = await supabaseClient
        .from("foods")
        .select()
        .eq("user_id", userId);

      if (error) throw error;

      setProfileFoodList(data);
    } catch {
      showNotificationError("Failed to fetch profile food list.");
    }
  };

  return (
    <div>
      {isOwner && <h1>My Profile</h1>}
      {!isOwner && <h1>Profile</h1>}
      <code>{JSON.stringify(profile)}</code>
      <br />
      {isOwner && <AddFoodForm />}
      <br />
      {isOwner && <h1>My Food List</h1>}
      {!isOwner && <h1>Profile Food List</h1>}

      {/* Profile food list fetched. */}
      {profileFoodList && profileFoodList.length > 0 && (
        <ul>
          {profileFoodList.map((food) => (
            <li key={food.id}>
              <Link href={`/p/foods/${encodeURIComponent(food.id)}`}>
                <a>{food.name}</a>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* No food fetched. */}
      {!profileFoodList ||
        (profileFoodList.length === 0 && <p>No food found</p>)}
    </div>
  );
};

export default Profile;
