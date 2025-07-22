import type { Config } from "@netlify/functions";
import { Resend } from 'resend';

const resend = new Resend('re_Bh5dCY4H_B8meJUqgiENwYXfAQdMf1HUr');

export default async (req: Request) => {
  const { data, error } = await resend.emails.send({
    from: 'it@soharstar.com',
    to: ['gokul.nathiel2305@gmail.com'],
    subject: 'Hello World',
    html: '<strong>It works!</strong>',
  });

  if (error) {
    return console.error({ error });
  }

  console.log({ data });

  const { next_run } = await req.json();
  console.log("Received event Next invocation at:", next_run);
};

export const config: Config = {
//   schedule: " 04 00 1 * * ",
  schedule: " * * * * * ",
};


// re_Bh5dCY4H_B8meJUqgiENwYXfAQdMf1HUr