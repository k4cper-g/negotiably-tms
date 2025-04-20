"use client"; // Required for useState

import { useState } from "react"; // Import useState
import { Plus, Search } from "lucide-react";
import { useRouter } from 'next/navigation'; // Import useRouter for navigation

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContactCard } from "@/components/contacts/ContactCard";
import { ContactCardSkeleton } from "@/components/contacts/ContactCardSkeleton";
import { ContactFormDialog, ContactFormData } from "@/components/contacts/ContactFormDialog"; // Import Dialog and FormData type
// ContactDetailSheet import removed
// Import DropdownMenu components if needed later for sorting/filtering
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";

// Define the Contact type (can also be imported if defined centrally)
type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  negotiationCount?: number;
  notes?: string; // Add notes if it should be part of the main contact object displayed/edited
};

// Mock data for demonstration
const mockContacts: Contact[] = [
  { id: "1", firstName: "Alice", lastName: "Smith", company: "Global Shippers", email: "alice.s@globalshippers.com", phone: "555-1234", negotiationCount: 5, notes: "Prefers morning calls." },
  { id: "2", firstName: "Bob", lastName: "Johnson", company: "Freight Masters", email: "bob.j@freightmasters.net", phone: "555-5678", avatarUrl: "/placeholder-avatar.png", negotiationCount: 2 },
  { id: "3", firstName: "Charlie", lastName: "Brown", email: "charlie@example.com", negotiationCount: 0 },
  { id: "4", firstName: "Diana", lastName: "Prince", company: "Logistics Inc.", email: "diana.p@logistics.co", phone: "555-9900", negotiationCount: 12, notes: "Met at the expo.\nHandles high-value cargo." }, // Example multi-line note
  { id: "5", firstName: "Ethan", lastName: "Hunt", email: "ethan.h@missiontransport.org", phone: "555-1122" },
];

export default function ContactsPage() {
  // --- State Management ---
  const [isLoading, setIsLoading] = useState(false); // Example loading state
  const [contacts, setContacts] = useState<Contact[]>(mockContacts); // Manage contacts list
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Partial<ContactFormData> | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false); // For form submission state
  // Detail Sheet state removed
  const router = useRouter(); // Initialize router

  // --- Handlers ---
  const handleAddContactClick = () => {
    setEditingContact(undefined); // Ensure no initial data for adding
    setIsFormDialogOpen(true);
  };

  const handleEditContactClick = (contact: Contact) => {
    // Map the full Contact object to the ContactFormData structure if needed
    // For now, assuming Contact and ContactFormData are similar enough for mock data
    setEditingContact(contact);
    setIsFormDialogOpen(true);
  };

  const handleDeleteContactClick = (contactId: string) => {
    console.log("Delete contact:", contactId);
    // Add confirmation dialog here in a real app
    setContacts(contacts.filter(c => c.id !== contactId));
    // Sheet closing logic removed
  };

  const handleNegotiateClick = (contact: Contact) => {
    console.log("Negotiate with contact:", contact.id, contact.firstName);
    // Placeholder: Navigate to negotiations page, potentially pre-filling contact info
    // Example navigation (adapt path and query params as needed):
    // router.push(`/negotiations/new?contactId=${contact.id}`);
    alert(`Initiate negotiation with ${contact.firstName} ${contact.lastName} (ID: ${contact.id}) - Navigation placeholder.`);
  };

  const handleFormSubmit = async (data: ContactFormData) => {
    console.log("Submitting contact:", data);
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (data.id) {
      // Edit existing contact
      const updatedContacts = contacts.map(c => c.id === data.id ? { ...c, ...data } : c);
      setContacts(updatedContacts);
      // selectedContact update logic removed
      console.log("Updated contact:", data.id);
    } else {
      // Add new contact
      const newContact: Contact = {
          ...data,
          id: Date.now().toString(), // Generate a temporary ID
          negotiationCount: 0, // Default value
      };
      setContacts([...contacts, newContact]);
      console.log("Added new contact:", newContact.id);
    }
    setIsFormDialogOpen(false);
  };

  // --- Rendering ---
  return (
    <> {/* Fragment for Page + Dialog + Sheet */}
      <div className="flex flex-col h-full px-4 py-6 md:px-6 lg:py-6 lg:px-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Contacts</h1>
          <p className="text-muted-foreground">Save your contacts for future negotiations</p>
        </div>
        

        {/* Action Bar */}
        <div className="flex items-center space-x-2 mt-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              className="pl-8 w-full sm:w-64 md:w-80" // Adjust width as needed
              // Add onChange handler later for search functionality
            />
          </div>
          {/* Optional: Sorting/Filtering Dropdown */}
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Sort By</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
               Dropdown items here
            </DropdownMenuContent>
          </DropdownMenu> */}
          <Button onClick={handleAddContactClick}> {/* Attach onClick handler */}
            <Plus className=" h-4 w-4" /> Add Contact
          </Button>
        </div>

        {/* Contact List Area */}
        <div className="flex-1 overflow-y-auto pr-2"> {/* Added overflow and padding for scrollbar */}
          {isLoading ? (
            // Loading State: Render multiple skeleton cards
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Render enough skeletons to suggest loading */}
              {[...Array(6)].map((_, index) => (
                <ContactCardSkeleton key={index} />
              ))}
            </div>
          ) : contacts.length > 0 ? (
            // Display Contact Cards
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  // Pass handlers down to the card
                  onEdit={() => handleEditContactClick(contact)}
                  onDelete={() => handleDeleteContactClick(contact.id)}
                  onNegotiate={() => handleNegotiateClick(contact)} // Pass negotiate handler
                />
              ))}
            </div>
          ) : (
            // Empty State
            <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-muted rounded-lg p-4 text-center text-muted-foreground">
              <p className="mb-2">No contacts found.</p>
              <p className="text-sm">Click 'Add Contact' to save your first contact.</p>
              {/* Optional: Add an icon here */}
            </div>
          )}
        </div>
      </div>

      {/* Render the Dialog */}
      <ContactFormDialog
        open={isFormDialogOpen}
        onOpenChange={(open) => {
          console.log('ContactFormDialog onOpenChange triggered with:', open);
          setIsFormDialogOpen(open);
        }}
        initialData={editingContact}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      {/* ContactDetailSheet rendering removed */}
    </>
  );
} 