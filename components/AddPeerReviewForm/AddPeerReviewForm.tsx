import { IconCheck } from "@tabler/icons";
import { upperFirst } from "@mantine/hooks";
import { useForm } from "@mantine/form";
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
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { showNotificationError } from "@/utils/notification";
import Compressor from "compressorjs";
import { hideNotification, showNotification } from "@mantine/notifications";
import { MAX_IMAGE_SIZE } from "constants/file";
import { logApiCall } from "@/utils/analytics";
import { Database } from "lib/database.types";
import { uploadFileAsFormData } from "@/utils/file";

// Based on: https://dev.to/ankittanna/how-to-create-a-type-for-complex-json-object-in-typescript-d81#:~:text=After%20TypeScript%203.7%20we%20can,Happy%20coding!

type FormValues = {
  presentation_score: { score: number; comment: string };
  technical_score: { score: number; comment: string };
  assists_peers_score: { score: number; comment: string };
  documentation_score: { score: number; comment: string };
  optional_rating?: { score: number; stood_out: string };
};

export function AddPeerReviewForm(props: PaperProps) {
  const supabaseClient = useSupabaseClient();
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [isCompressing, setIsCompresing] = useState(false);
  const user = useUser();

  const form = useForm<FormValues>({
    initialValues: {
      presentation_score: { score: 0, comment: "" },
      technical_score: { score: 0, comment: "" },
      assists_peers_score: { score: 0, comment: "" },
      documentation_score: { score: 0, comment: "" },
      optional_rating: { score: 0, stood_out: "" },
    },
  });

  if (!user) return null;

  const handleAddPeerReview = async (values: FormValues) => {
    // Save the peer review to the database.
    const { error: insertError } = await supabaseClient
      .from("peer_reviews")
      .insert({
        created_by: user.id,
        reviewee: user.id,
        review: {
          presentation_score: values.presentation_score,
          technical_score: values.technical_score,
          assists_peers_score: values.assists_peers_score,
          documentation_score: values.documentation_score,
          optional_rating: values.optional_rating,
        },
      });

    if (insertError) throw insertError;
  };

  return (
    <Paper radius="md" p="xl" withBorder {...props}>
      <Divider label="Add peer review" labelPosition="center" my="lg" />
      <form
        onSubmit={form.onSubmit((values) => {
          handleAddPeerReview(values);
        })}
      >
        <Stack>
          <b>Presentation score</b>
          <Rating
            value={form.values.presentation_score.score}
            onChange={(value) =>
              form.setFieldValue("presentation_score.score", value)
            }
          />
          <TextInput
            label="Presentation comment"
            placeholder="presentation comment"
            value={form.values.presentation_score.comment}
            onChange={(event) =>
              form.setFieldValue(
                "presentation_score.comment",
                event.currentTarget.value
              )
            }
          />
          <b>Technical score</b>
          <Rating
            value={form.values.technical_score.score}
            onChange={(value) =>
              form.setFieldValue("technical_score.score", value)
            }
          />
          <TextInput
            label="Technical comment"
            placeholder="technical comment"
            value={form.values.technical_score.comment}
            onChange={(event) =>
              form.setFieldValue(
                "technical_score.comment",
                event.currentTarget.value
              )
            }
          />
          <b>Assists Peers Score</b>
          <Rating
            value={form.values.assists_peers_score.score}
            onChange={(value) =>
              form.setFieldValue("assists_peers_score.score", value)
            }
          />
          <TextInput
            label="Assists Peers comment"
            placeholder="Assists Peers comment"
            value={form.values.assists_peers_score.comment}
            onChange={(event) =>
              form.setFieldValue(
                "assists_peers_score.comment",
                event.currentTarget.value
              )
            }
          />
          <b>Documentation Score</b>
          <Rating
            value={form.values.documentation_score.score}
            onChange={(value) =>
              form.setFieldValue("documentation_score.score", value)
            }
          />
          <TextInput
            label="Documentation comment"
            placeholder="documentation comment"
            value={form.values.documentation_score.comment}
            onChange={(event) =>
              form.setFieldValue(
                "documentation_score.comment",
                event.currentTarget.value
              )
            }
          />
          <b>Optional Rating</b>
          <Rating
            value={form.values.optional_rating?.score}
            onChange={(value) =>
              form.setFieldValue("optional_rating.score", value)
            }
          />
          <TextInput
            label="Optional rating stood out"
            placeholder="optional rating stood out"
            value={form.values.optional_rating?.stood_out}
            onChange={(event) =>
              form.setFieldValue(
                "optional_rating.stood_out",
                event.currentTarget.value
              )
            }
          />
        </Stack>

        <Button disabled={isAddingImage || isCompressing} type="submit">
          {upperFirst("add peer review")}
        </Button>
      </form>
    </Paper>
  );
}
