// @ts-nocheck

import {
  TextInput,
  Paper,
  PaperProps,
  Button,
  Divider,
  Stack,
  FileInput,
  Rating,
  Select,
  JsonInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { upperFirst } from "@mantine/hooks";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Database } from "lib/database.types";
import type { NextPage } from "next";
import { useEffect, useState } from "react";

type FormValues = {
  keyword: string;
  columnType: ColumnType;
};

type ColumnType = "text" | "jsonb";

const HellWeekPage: NextPage = () => {
  const supabaseClient = useSupabaseClient();

  const [data, setData] = useState();

  const form = useForm<FormValues>({
    initialValues: {
      keyword: "adidas",
      columnType: "text",
    },
  });

  // useEffect(() => {
  //   const fetch = async () => {
  //     // const { data, error } = await supabaseClient
  //     //   .from("users")
  //     //   .select()
  //     //   .contains("address", { street: "Melrose Place" });
  //     // console.log(JSON.stringify(data));

  //     // const { data, error } = await supabaseClient
  //     //   .from("books")
  //     //   .select("title,description:metadata->description");

  //     const { data, error } = await supabaseClient
  //       .from("books")
  //       .select("title,description:metadata->description")
  //       .ilike("metadata->>description", "%Slow%");

  //     console.log(JSON.stringify(data));
  //   };

  //   fetch();
  // }, []);

  // adidas appeared n times from n users.
  // i can make this query unique per user to count the user but i would be double querying.
  const handleFetchFromTextColumn = async (keyword: string) => {
    const { data, error, count } = await supabaseClient
      .from("images")
      .select("*", { count: "exact", head: true })
      .ilike("description", `%${keyword}%`);

    // return data;
    setData(data || count);
  };
  const handleFetchFromJsonbColumn = async (keyword: string) => {
    // const { data, error } = await supabaseClient
    //   .from("peer_reviews")
    //   .select()
    //   .ilike("review->>comment", `%${keyword}%`);

    const { data, error } = await supabaseClient
      .from("peer_reviews")
      .select()
      .or(
        `review->>name.ilike.%${keyword}%,review->>comment.ilike.%${keyword}%`
      );

    // return data;
    setData(data);
  };

  const handleCountKeywordOccurenceImageDescription = async (
    keyword: string
  ) => {
    // Supabase call rpc() count_keyword_occurence_image_description.

    const { data, error } = await supabaseClient.rpc(
      "count_keyword_occurence_image_description",
      {
        keyword,
      }
    );

    // return data;
    setData(data);
  };

  const handleCountKeywordOccurenceImageDescriptionDistinct = async (
    keyword: string
  ) => {
    // Supabase call rpc() count_keyword_occurence_image_description.

    const { data, error } = await supabaseClient.rpc(
      "count_keyword_occurence_image_description_distinct",
      {
        keyword,
      }
    );

    // return data;
    setData(data);
  };

  const handleCountKeywordOccurenceImageDescriptionGroup = async (
    keyword: string
  ) => {
    // Supabase call rpc() count_keyword_occurence_image_description.

    const { data, error } = await supabaseClient.rpc(
      "count_keyword_occurence_image_description_group",
      {
        keyword,
      }
    );

    // return data;
    setData(data);
  };

  const handleCountKeywordOccurenceReview = async (keyword: string) => {
    // Supabase call rpc() count_keyword_occurence_image_description.

    const { data, error } = await supabaseClient.rpc(
      "count_keyword_occurence_image_description_group_fts",
      {
        keyword,
      }
    );

    // return data;
    setData(data);
  };

  const handleCountKeywordOccurenceReviewGroup = async (keyword: string) => {
    // Supabase call rpc() count_keyword_occurence_image_description.

    const { data, error } = await supabaseClient.rpc(
      "count_keyword_occurence_peer_reviews_review_group",
      {
        keyword,
      }
    );

    // return data;
    setData(data);
  };

  return (
    <div>
      <Paper radius="md" p="xl" withBorder>
        <Divider label="Add to my food list" labelPosition="center" my="lg" />
        <form
          onSubmit={form.onSubmit((values) => {
            console.log(values);
            if (values.columnType === "text") {
              // handleFetchFromTextColumn(values.keyword);
              // handleCountKeywordOccurenceImageDescription(values.keyword);
              // handleCountKeywordOccurenceImageDescriptionDistinct(
              //   values.keyword
              // );
              handleCountKeywordOccurenceImageDescriptionGroup(values.keyword);
            } else {
              // handleFetchFromJsonbColumn(values.keyword);
              handleCountKeywordOccurenceReview(values.keyword);
            }
          })}
        >
          <Stack>
            <TextInput
              required
              label="Keyword"
              placeholder="keyword"
              value={form.values.keyword}
              onChange={(event) =>
                form.setFieldValue("keyword", event.currentTarget.value)
              }
              error={form.errors.keyword && "Invalid keyword"}
              {...form.getInputProps("keyword")}
            />
            <Select
              label="Column type"
              placeholder="Text or Jsonb"
              value={form.values.columnType}
              data={[
                { value: "text", label: "Text" },
                { value: "jsonb", label: "Jsonb" },
              ]}
              onChange={(value) =>
                form.setFieldValue(
                  "columnType",
                  (value as FormValues["columnType"]) || "text"
                )
              }
            />
          </Stack>
          <Button type="submit">{upperFirst("fetch keyword occurence")}</Button>
        </form>
      </Paper>
      <JsonInput value={JSON.stringify(data)} />
    </div>
  );
};

export default HellWeekPage;
