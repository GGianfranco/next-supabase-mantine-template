// Due to Vercel issue below, we won't be using Vercel middleware to protect this API route.
// Issue: Presence of middleware prevents access to raw request bodies greater than or equal to 16,384 bytes (16 KiB) #39262
// https://github.com/vercel/next.js/issues/39262
// Update (10/30/2022) - I have updated the next to 13 but still issue persists.

// Based on:
// https://supabase.com/docs/guides/auth/auth-helpers/nextjs
// https://github.com/supabase/storage-api/issues/86#issuecomment-1085301519

import { logApiCall } from "@/utils/analytics";
import { withApiAuth } from "@supabase/auth-helpers-nextjs";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import formidable from "formidable";
import fs from "fs";
import sharp from "sharp";

export const config = {
  api: {
    bodyParser: false,
  },
};

// POST

export default withApiAuth(async function ProtectedRoute(req, res, supabase) {
  if (req.method === "POST") {
    try {
      const supabaseServerClient = createServerSupabaseClient({
        req,
        res,
      });
      const {
        data: { user },
      } = await supabaseServerClient.auth.getUser();
      if (!user) throw Error("No user");

      // Parse file from form data with formidable.
      const form = new formidable.IncomingForm();
      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error("Error", err);
          throw err;
        }
        // console.log("Fields", fields);
        // console.log("Files", files);
        if (!files?.file) throw new Error("No file");

        const file = files.file as formidable.File;
        const rawData = fs.readFileSync(file.filepath);

        // Save food to database.
        const prefix = `compressed_${Date.now()}_${user?.id}`;
        const prefixedFilename = `${prefix}_${file.originalFilename}`;
        const filePath = prefixedFilename;

        // Compress image with sharp here.
        // Based on:https://github.dev/alberto-linao/paperless-v3/tree/5cc3796b41ae90fcc411d5fc0d2e4e507c423112
        // https://github.com/zernonia/supabase-cdn-transformation/blob/master/api/resize.ts
        const compressedRawData = await sharp(rawData)
          .toFormat("jpg")
          .jpeg({ mozjpeg: true, quality: 30, force: true })
          .toBuffer();

        const { data, error: uploadError } = await supabaseServerClient.storage
          .from("avatars")
          .upload(filePath, compressedRawData, {
            contentType: file.mimetype || undefined,
          });
        if (uploadError) throw uploadError;

        await logApiCall(supabaseServerClient, {
          api_name: `${req.method}: ${req.url}`,
          called_by: user.id,
        });

        return res.status(200).json({ path: data.path });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: "Internal server error." });
    }
  }
});

// async function handle(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method === "POST") {
//     try {
//       // Parse file from form data with formidable.
//       const form = new formidable.IncomingForm();
//       console.log("🚀🚀🚀🚀🚀🚀");
//       form.parse(req, (err, fields, files) => {
//         if (err) {
//           console.error("Error", err);
//           throw err;
//         }
//         console.log("Fields", fields);
//         console.log("Files", files);
//       });

//       return res.status(200).json({ message: "Success" });
//     } catch (error) {
//       console.error(error);
//       return res.status(500).send({ message: "Internal server error." });
//     }
//   }
// }

// export default handle;
