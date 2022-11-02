// @ts-nocheck

import { AddImageForm } from "@/components/AddImageForm/AddImageForm";
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
  searchImplem: SearchImplem;
};

type SearchImplem = "ilike" | "fullTextSearch";

const HellWeekPage: NextPage = () => {
  const supabaseClient = useSupabaseClient();
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState("Rows will appear here");
  const [summary, setSummary] = useState(
    "<keyword> appeared <n> times from <n> users here."
  );
  const [perUser, setPerUser] = useState("Occurence per user here.");

  const form = useForm<FormValues>({
    initialValues: {
      keyword: "adidas",
      searchImplem: "ilike",
    },
  });

  const handleCountKeywordOccurenceFromImageDescriptionIlike = async (
    keyword: string
  ) => {
    setLoading(true);

    const { data: rows } = await supabaseClient.rpc(
      "keyword_occurence_image_description",
      {
        keyword,
      }
    );

    const { data: totalOccurence } = await supabaseClient.rpc(
      "count_keyword_occurence_image_description",
      {
        keyword,
      }
    );

    const { data: totalUsers } = await supabaseClient.rpc(
      "count_keyword_occurence_image_description_distinct",
      {
        keyword,
      }
    );

    const { data: grouped } = await supabaseClient.rpc(
      "count_keyword_occurence_image_description_group",
      {
        keyword,
      }
    );

    setData(rows);
    setSummary(
      `"${keyword}" appeared ${totalOccurence} times from ${totalUsers} users using ilike operator.`
    );
    setPerUser(grouped);
    setLoading(false);
  };

  const handleCountKeywordOccurenceFromImageDescriptionFts = async (
    keyword: string
  ) => {
    setLoading(true);

    const { data: rows } = await supabaseClient.rpc(
      "keyword_occurence_image_description_fts",
      {
        keyword,
      }
    );

    const { data: totalOccurence } = await supabaseClient.rpc(
      "count_keyword_occurence_image_description_fts",
      {
        keyword,
      }
    );

    const { data: totalUsers } = await supabaseClient.rpc(
      "count_keyword_occurence_image_description_distinct_fts",
      {
        keyword,
      }
    );

    const { data: grouped } = await supabaseClient.rpc(
      "count_keyword_occurence_image_description_group_fts",
      {
        keyword,
      }
    );

    setData(rows);
    setSummary(
      `"${keyword}" appeared ${totalOccurence} times from ${totalUsers} users using full-text search.`
    );
    setPerUser(grouped);
    setLoading(false);
  };

  return (
    <div>
      <AddImageForm />
      <br />
      <Paper radius="md" p="xl" withBorder>
        <Divider label="Keyword analysis" labelPosition="center" my="lg" />
        <form
          onSubmit={form.onSubmit((values) => {
            console.log(values);
            if (values.searchImplem === "ilike") {
              handleCountKeywordOccurenceFromImageDescriptionIlike(
                values.keyword
              );
            } else if (values.searchImplem === "fullTextSearch") {
              handleCountKeywordOccurenceFromImageDescriptionFts(
                values.keyword
              );
            } else {
              alert("no search implem");
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
              label="Search implementation"
              placeholder="ilike operator or full-text search"
              value={form.values.searchImplem}
              data={[
                { value: "ilike", label: "ilike" },
                { value: "fullTextSearch", label: "full-text search" },
              ]}
              onChange={(value) =>
                form.setFieldValue(
                  "searchImplem",
                  (value as FormValues["searchImplem"]) || "ilike"
                )
              }
            />
          </Stack>
          <Button disabled={loading} type="submit">
            {upperFirst("fetch keyword occurence")}
          </Button>
        </form>
      </Paper>
      <br />
      <b>Total occurence</b>
      <JsonInput value={JSON.stringify(summary, null, 2)} autosize />
      <br />
      <b>Per user occurence</b>
      <JsonInput value={JSON.stringify(perUser, null, 2)} autosize />
      <br />
      <b>Rows where keyword exists</b>
      <JsonInput value={JSON.stringify(data, null, 2)} autosize />
    </div>
  );
};

export default HellWeekPage;
