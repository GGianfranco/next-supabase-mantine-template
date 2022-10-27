import type { NextPage } from "next";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { showNotificationError } from "@/utils/notification";
import { definitions } from "lib/database";

const ProfileList: NextPage = () => {
  const supabaseClient = useSupabaseClient();
  const [profileList, setProfileList] = useState<definitions["profiles"][]>([]);

  // Fetch profile list on page load.
  useEffect(() => {
    fetchProfileList();
  }, []);

  // Fetch profile list when there is a change in profiles table.
  supabaseClient
    .channel("db-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "profiles",
      },
      () => fetchProfileList()
    )
    .subscribe();

  // Fetch profile list from database.
  const fetchProfileList = async () => {
    try {
      const { data, error } = await supabaseClient.from("profiles").select();
      if (error) throw error;
      setProfileList(data);
    } catch {
      showNotificationError("Failed to fetch profile list.");
      // Log error here.
    }
  };

  return (
    <div>
      <h1>Profiles</h1>
      <h2>Profile List</h2>

      {/* Profile fetched. */}
      {profileList && profileList.length > 0 && (
        <ul>
          {profileList.map((profile) => (
            <li key={profile.id}>
              <Link href={`/p/profiles/${encodeURIComponent(profile.id)}`}>
                <a>{profile.id}</a>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* No profile fetched. */}
      {!profileList || (profileList.length === 0 && <p>No profile found</p>)}
    </div>
  );
};

export default ProfileList;
