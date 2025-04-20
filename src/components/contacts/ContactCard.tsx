import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Mail, MoreVertical, Phone, Trash2, Edit, FileText } from "lucide-react";

// Define a basic type for the contact prop - adjust as needed when connecting to data
type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  email: string;
  phone?: string;
  avatarUrl?: string; // Optional avatar image URL
  negotiationCount?: number; // Optional count of associated negotiations
  notes?: string; // Ensure notes is included if passed from parent
};

interface ContactCardProps {
  contact: Contact;
  onEdit: () => void;
  onDelete: () => void;
  onNegotiate: () => void;
}

export function ContactCard({ contact, onEdit, onDelete, onNegotiate }: ContactCardProps) {
  const initials = `${contact.firstName?.[0] ?? ''}${contact.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4">
        <Avatar>
          <AvatarImage src={contact.avatarUrl} alt={`${contact.firstName} ${contact.lastName}`} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle>{`${contact.firstName} ${contact.lastName}`}</CardTitle>
          {contact.company && (
            <CardDescription>{contact.company}</CardDescription>
          )}
        </div>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onNegotiate}>
              <FileText className="mr-2 h-4 w-4" />
              Negotiate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex-grow space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{contact.email}</span>
        </div>
        {contact.phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4 flex-shrink-0" />
            <span>{contact.phone}</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {contact.negotiationCount !== undefined && contact.negotiationCount > 0 ? (
           <Badge variant="secondary">
             {contact.negotiationCount} Past Negotiation{contact.negotiationCount !== 1 ? 's' : ''}
           </Badge>
        ) : (
            <span className="text-xs text-muted-foreground">No past negotiations</span>
        )}
      </CardFooter>
    </Card>
  );
} 