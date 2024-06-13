import emailjs from '@emailjs/browser';
import type { Config } from "@netlify/functions";

export default async (req: Request) => {

    const serviceId = "service_lunn2bp";
    const templateId = "template_1y0oq9l";

    try {
        emailjs.init("c8AePKR5BCK8UIn_E")
      await emailjs.send(serviceId, templateId, {
        name: "Gokul",
        recipient: "Goblinn688@gmail.com",
        message:"If you recieved this message, the email reminder function is running sucessfully, Congratulations"
      });
      console.log("email successfully sent");
    } catch (error) {
      console.log(error);
    }
    const { next_run } = await req.json()

    console.log("Received event! Next invocation at:", next_run)
}

export const config: Config = {
    schedule:"39 13 * 6 4"
}