
interface EmailTemplateProps {
  firstName: string;
  url:string
}

export function EmailTemplate({ firstName,url }: EmailTemplateProps) {
  return (
    <div>
      <h1>Welcome, {firstName}!</h1>
      <p>
        Click the link to verify your email {url}
      </p>
    </div>
  );
}