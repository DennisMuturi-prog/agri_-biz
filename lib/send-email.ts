import { EmailTemplate } from "@/components/email-template";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
type EmailVerificationDetails = {
  to: string,
  username: string,
  url:string
}

type DuplicateEmailDetails = {
  to: string,
  username: string,
  ipAddress: string,
  userAgent:string
  
}

export async function sendVerificationEmail(emailVerificationDetails:EmailVerificationDetails) {
  const { data, error } = await resend.emails.send({
     from: 'AgriBiz <onboarding@dennismuturi.xyz>',
     to: [emailVerificationDetails.to],
     subject: 'Email Verification',
     html: `<div>
       <h1>Welcome, ${emailVerificationDetails.username}!</h1>
       <p>
         Click the link to verify your email ${emailVerificationDetails.url}
       </p>
     </div>`,
   });
  console.log("resend error",error)
  
}

export async function sendDuplicateSignupEmailAlert(duplicateEmailDetails:DuplicateEmailDetails) {
  const { data, error } = await resend.emails.send({
     from: 'AgriBiz <onboardin@dennismuturi.xyz>',
     to: [duplicateEmailDetails.to],
     subject: 'Duplicate Signup',
    html: `<div>
     <h1>Security alert</h1>
       <h2>Hi, ${duplicateEmailDetails.username}!</h2>
       <p>
         Someone tried to sign up with your email ,the person uses  ${duplicateEmailDetails.userAgent} browser and the ip address is ${duplicateEmailDetails.ipAddress}.If it was you and forgot your password go to the login page and reset password
       </p>
     </div>`,
   });
  console.log("resend error",error)
  
}
