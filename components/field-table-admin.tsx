import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
function formatTimestampToDate(date:Date) {

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}
type Field = {
  id:number
  name: string
  cropType: string
  plantingDate: Date
  fieldStage: string
  fieldAgentName: string
  fieldAgentEmail: string
  fieldAgentId: string
}
type FieldTableBlockProps = {
  fields: Field[]
}

export function FieldAdminTable({ fields }: FieldTableBlockProps) {
  return (
    <Table>
      <TableCaption>A list of your fields</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Name</TableHead>
          <TableHead>Crop type</TableHead>
          <TableHead>Planting date</TableHead>
          <TableHead>Field status</TableHead>
          <TableHead>Agent assigned</TableHead>
          <TableHead>Agent email</TableHead>
          <TableHead className="text-right">field stage</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fields.map((field) => (
          <TableRow key={field.id}>
            <TableCell className="font-medium">{field.name}</TableCell>
            <TableCell>{field.cropType}</TableCell>
            <TableCell>{formatTimestampToDate(field.plantingDate)}</TableCell>
            <TableCell>Active</TableCell>
            <TableCell>{field.fieldAgentName}</TableCell>
            <TableCell>{field.fieldAgentEmail}</TableCell>
            <TableCell className="text-right">{field.fieldStage}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}