import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
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

const invoices = [
  {
    invoice: "INV001",
    paymentStatus: "Paid",
    totalAmount: "$250.00",
    paymentMethod: "Credit Card",
  },
  {
    invoice: "INV002",
    paymentStatus: "Pending",
    totalAmount: "$150.00",
    paymentMethod: "PayPal",
  },
  {
    invoice: "INV003",
    paymentStatus: "Unpaid",
    totalAmount: "$350.00",
    paymentMethod: "Bank Transfer",
  },
  {
    invoice: "INV004",
    paymentStatus: "Paid",
    totalAmount: "$450.00",
    paymentMethod: "Credit Card",
  },
  {
    invoice: "INV005",
    paymentStatus: "Paid",
    totalAmount: "$550.00",
    paymentMethod: "PayPal",
  },
  {
    invoice: "INV006",
    paymentStatus: "Pending",
    totalAmount: "$200.00",
    paymentMethod: "Bank Transfer",
  },
  {
    invoice: "INV007",
    paymentStatus: "Unpaid",
    totalAmount: "$300.00",
    paymentMethod: "Credit Card",
  },
]
type Field = {
  id:number
  name: string
  cropType: string
  plantingDate: Date
  fieldStage:string
}
type FieldTableBlockProps = {
  fields: Field[]
}

export function FieldTable({ fields }: FieldTableBlockProps) {
  return (
    <Table>
      <TableCaption>A list of your fields</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Name</TableHead>
          <TableHead>Crop type</TableHead>
          <TableHead>Planting date</TableHead>
          <TableHead>Field status</TableHead>
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
            <TableCell className="text-right">{field.fieldStage}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
