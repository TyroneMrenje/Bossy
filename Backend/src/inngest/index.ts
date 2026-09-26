import { Inngest } from "inngest";
import { query } from "../db/postclient";


// Create a client to send and receive events
export const inngest = new Inngest({ id: "my-app" });

const emailReceived = inngest.createFunction(
    {
        id:"process-email",
        triggers: [
            {event: "email.received"}
        ]
    },

    async({event,step}) =>{
      
        const email = await step.run(
        "fetch-email",
        async () => {

            const fetchEmail = await query<{email_address:string}>("SELECT email_address FROM gmail_state WHERE email_address = $1",[
                event.data.recipient
            ]);

            return fetchEmail;        
        }
        );

        const classification = await step.run(
        "classify-email",
        async () => {
           const importantEmails=[
              "tyronemrenje@gmail.com",
              "tyronemrenje1985@gmail.com",
              "boss@gmail.com"
           ]

           for(const importantEmail of importantEmails){
             if (!(event.data.sender == importantEmail)){

             }

           }
        }
        );

        await step.run(
        "save-email",
        async () => {
           
        }
        );

        return classification;

    }
)
export const functions = [
    emailReceived
];