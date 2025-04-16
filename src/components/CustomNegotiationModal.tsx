"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Loader2, UserRoundCog } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";

// Define the form schema
const formSchema = z.object({
  origin: z.string().min(2, "Origin must be at least 2 characters"),
  destination: z.string().min(2, "Destination must be at least 2 characters"),
  price: z.string().min(1, "Price is required"),
  distance: z.string().min(1, "Distance is required"),
  loadType: z.string().min(1, "Load type is required"),
  weight: z.string().min(1, "Weight is required"),
  dimensions: z.string().min(1, "Dimensions are required"),
  carrier: z.string().min(1, "Carrier/Company is required"),
  notes: z.string().optional(),
  offerContactEmail: z.string().email("Invalid email address").min(1, "Contact email is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface CustomNegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomNegotiationModal({ 
  isOpen,
  onClose
}: CustomNegotiationModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get the mutation to create a negotiation
  const createNegotiation = useMutation(api.negotiations.createNegotiation);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origin: "",
      destination: "",
      price: "",
      distance: "",
      loadType: "",
      weight: "",
      dimensions: "",
      carrier: "",
      notes: "",
      offerContactEmail: "",
    }
  });

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Generate a unique ID for the external offer
      const externalOfferId = `external-${Date.now()}`;
      
      // Create the negotiation with the provided details
      const result = await createNegotiation({
        offerId: externalOfferId, // Use the generated external ID
        initialRequest: {
          origin: values.origin,
          destination: values.destination,
          price: values.price,
          distance: values.distance || undefined,
          loadType: values.loadType || undefined,
          weight: values.weight || undefined,
          dimensions: values.dimensions || undefined,
          carrier: values.carrier || undefined,
          notes: values.notes || undefined,
          offerContactEmail: values.offerContactEmail || undefined,
        }
      });
      
      // Close the modal
      onClose();
      
      // Navigate to the newly created negotiation if needed
      if (result?.negotiationId) {
        // Option: navigate to negotiation detail page
        // router.push(`/negotiations/${result.negotiationId}`);
        router.refresh(); // Refresh to show the new negotiation in the list
      }
    } catch (error) {
      console.error("Error creating negotiation:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-white border-neutral-200 text-neutral-900 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            <div className="flex items-center">
              <UserRoundCog className="w-4 h-4 mr-2" />
              Create Custom Negotiation
            </div>
          </DialogTitle>
          <DialogDescription className="text-neutral-500 dark:text-neutral-400">
            Add the details of the offer you want to negotiate.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="origin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-700 dark:text-neutral-300">Origin*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="City, Country" 
                        className="bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-offset-white focus-visible:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:ring-offset-neutral-900"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-700 dark:text-neutral-300">Destination*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="City, Country" 
                        className="bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-offset-white focus-visible:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:ring-offset-neutral-900"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-700 dark:text-neutral-300">Price*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. €2500" 
                        className="bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-offset-white focus-visible:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:ring-offset-neutral-900"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="distance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-700 dark:text-neutral-300">Distance*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. 500 km" 
                        className="bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-offset-white focus-visible:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:ring-offset-neutral-900"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="carrier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-700 dark:text-neutral-300">Carrier/Company*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Carrier name" 
                        className="bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-offset-white focus-visible:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:ring-offset-neutral-900"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="offerContactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-700 dark:text-neutral-300">Contact Email*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="email@example.com" 
                        className="bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-offset-white focus-visible:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:ring-offset-neutral-900"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                    <FormDescription className="text-neutral-500">
                      Email address for negotiation communication
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="loadType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-700 dark:text-neutral-300">Load Type*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Pallets" 
                        className="bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-offset-white focus-visible:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:ring-offset-neutral-900"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-700 dark:text-neutral-300">Weight*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. 1200 kg" 
                        className="bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-offset-white focus-visible:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:ring-offset-neutral-900"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dimensions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-700 dark:text-neutral-300">Dimensions*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. 120x80x160 cm" 
                        className="bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-offset-white focus-visible:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:ring-offset-neutral-900"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-neutral-700 dark:text-neutral-300">Additional Notes</FormLabel> 
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional details about the offer..." 
                      className="resize-none h-20 bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-offset-white focus-visible:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:ring-offset-neutral-900"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Negotiation"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 