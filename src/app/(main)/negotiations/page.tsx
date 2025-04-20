"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MessageSquare,
  Loader2,
  Pin,
  Trash2,
  RefreshCw,
  ArrowRight,
  ChevronFirst,
  ChevronLast,
  MoreHorizontal,
  ArrowUpDown,
  ChevronDown,
  Eraser,
  ChevronLeft,
  ChevronRight,
  Plus,
  Eye,
  Pencil
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import { useNegotiationModal } from "@/context/NegotiationModalContext";
import { Id, Doc } from "../../../../convex/_generated/dataModel";
import { CustomNegotiationModal } from "@/components/CustomNegotiationModal";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  RowSelectionState,
} from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Define interface for negotiation
interface Negotiation {
  id: string;
  offerId: string;
  offerRoute?: string;
  origin: string;
  destination: string;
  carrier?: string;
  initialPrice: string;
  currentPrice?: string;
  profit?: string | null;
  profitPercentage?: string | null;
  status: "In Progress" | "Accepted" | "Rejected" | "Completed" | "Expired" | "pending";
  lastActivity?: string;
  dateCreated: string;
  messages: number;
  rounds?: number;
  loadingDate?: string;
  vehicle?: string;
  loadType?: string;
  aiAssistant?: boolean;
}

// Helper function to format currency
const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return '-'; // Handle invalid input
  // Use en-US locale for dot decimal and disable grouping
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'EUR', 
    useGrouping: false, // Disable thousands separators
    minimumFractionDigits: 2, // Ensure two decimal places
    maximumFractionDigits: 2 // Ensure two decimal places
  }).format(value);
};

// Define the NegotiationStatus type
type NegotiationStatus = "In Progress" | "Accepted" | "Rejected" | "Completed" | "Expired" | "pending";

// Define columns for the table
const columns: ColumnDef<Negotiation>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px] cursor-pointer"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px] cursor-pointer"
        onClick={(e) => e.stopPropagation()} // Prevent row click from triggering when clicking checkbox
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40, // Fixed width for checkbox column
  },
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <div className="text-sm">{row.original.id.substring(0, 8)}</div>,
    size: 100, // Fixed width for ID column
  },
  {
    accessorKey: "route",
    header: "Route",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <div className="flex items-center">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-1.5"></span>
          {row.original.origin}
        </div>
        <div className="flex items-center mt-1">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5"></span>
          {row.original.destination}
        </div>
      </div>
    ),
    size: 200, // Fixed width for route column
    sortingFn: (rowA, rowB) => {
      // Sort by origin + destination
      const routeA = `${rowA.original.origin}-${rowA.original.destination}`.toLowerCase();
      const routeB = `${rowB.original.origin}-${rowB.original.destination}`.toLowerCase();
      return routeA.localeCompare(routeB);
    },
  },
  {
    accessorKey: "carrier",
    header: "Carrier",
    cell: ({ row }) => <div>{row.original.carrier || "Unknown"}</div>,
    size: 150, // Fixed width for carrier column
  },
  {
    accessorKey: "initialPrice",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4 h-8 data-[state=open]:bg-accent"
      >
        Initial Price
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div>{row.original.initialPrice}</div>,
    size: 120, // Fixed width for initialPrice column
  },
  {
    accessorKey: "currentPrice",
    header: "Current Price",
    cell: ({ row }) => <div>{row.original.currentPrice || row.original.initialPrice}</div>,
    size: 120, // Fixed width for currentPrice column
  },
  {
    accessorKey: "profit",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4 h-8 data-[state=open]:bg-accent"
      >
        Profit
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const neg = row.original;
      return (
        <div className="flex items-center">
          {neg.profit ? (
            parseFloat(neg.profit.replace(/[^0-9.,\-]/g, '').replace(',', '.')) < 0 ? (
              // Negative profit (loss)
              <>
                <span className="text-red-600 font-medium">{neg.profit}</span>
                {neg.profitPercentage && (
                  <span className="text-xs text-red-500 ml-1">({neg.profitPercentage})</span>
                )}
              </>
            ) : neg.profit === "€0.00" ? (
              // No change
              <span className="text-muted-foreground">{neg.profit}</span>
            ) : (
              // Positive profit 
              <>
                <span className="text-green-600 font-medium">{neg.profit}</span>
                {neg.profitPercentage && (
                  <span className="text-xs text-green-500 ml-1">({neg.profitPercentage})</span>
                )}
              </>
            )
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      // Custom sorting function for profit
      const getProfitValue = (profit: string | null | undefined) => {
        if (!profit) return 0;
        if (profit === "€0.00") return 0;
        
        // Extract numeric value considering all formats
        try {
          // Strip all non-numeric chars except decimal separator and minus sign
          const numericStr = profit.replace(/[^0-9.,\-]/g, '').replace(',', '.');
          return parseFloat(numericStr);
        } catch {
          return 0;
        }
      };
      const profitA = getProfitValue(rowA.original.profit);
      const profitB = getProfitValue(rowB.original.profit);
      
      return profitA - profitB; // Sort ascending by numeric profit
    },
    size: 120, // Fixed width for profit column
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge 
          variant={
            status === "In Progress" || status === "pending" ? "secondary" :
            status === "Accepted" ? "success" :
            status === "Completed" ? "success" :
            status === "Rejected" ? "destructive" :
            "outline"
          }
          className="font-normal"
        >
          {status === "pending" ? "In Progress" : status}
        </Badge>
      );
    },
    size: 120, // Fixed width for status column
  },
  {
    accessorKey: "lastActivity",
    header: "Last Activity",
    cell: ({ row }) => <div className="text-xs text-muted-foreground">{row.original.lastActivity}</div>,
    size: 120, // Fixed width for lastActivity column
  },
  {
    accessorKey: "messages",
    header: "Messages",
    cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{row.original.messages}</span>
        </div>
    ),
    size: 80, // Fixed width for messages column
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const neg = row.original;
      return <NegotiationActions negotiation={neg} />;
    },
    size: 70, // Fixed width for actions column
    enableSorting: false,
    enableHiding: false,
  },
];

// NegotiationActions component to handle row actions
function NegotiationActions({ negotiation: neg }: { negotiation: any }) {
  const router = useRouter();
  const { openNegotiation } = useNegotiationModal();
  const deleteNegotiation = useMutation(api.negotiations.deleteNegotiation);
  const updateNegotiationPrice = useMutation(api.negotiations.updateCurrentPrice);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const [newPrice, setNewPrice] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    openNegotiation(neg.id as unknown as Id<"negotiations">);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    
    try {
      setIsDeleting(true);
      await deleteNegotiation({
        negotiationId: neg.id as unknown as Id<"negotiations">
      });
    } catch (error) {
      console.error("Error deleting negotiation:", error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrice.trim()) return;
    
    try {
      setIsUpdatingPrice(true);
      await updateNegotiationPrice({
        negotiationId: neg.id as unknown as Id<"negotiations">,
        newPrice: newPrice
      });
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating price:", error);
    } finally {
      setIsUpdatingPrice(false);
    }
  };
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={(e) => e.stopPropagation()} // Prevent row click
          >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            router.push(`/negotiations/${neg.id}`);
          }}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => handleOpenModal(e)}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Open as Floating Chat
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              setNewPrice(neg.currentPrice || neg.initialPrice);
              setEditDialogOpen(true);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit Price
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-red-600 focus:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
            }}
            disabled={isDeleting}
            asChild
          >
            <AlertDialog>
              <AlertDialogTrigger 
                className="w-full text-left px-2 py-1.5 text-sm text-red-600 relative flex cursor-default select-none items-center rounded-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete negotiation?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the negotiation and remove it from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    className="bg-red-600 hover:bg-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(e);
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Edit Current Price</DialogTitle>
            <DialogDescription>
              Update the current negotiated price. This will be recorded in the chat history.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePrice}>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="price" className="text-sm font-medium">
                  Current Price
                </label>
                <Input
                  id="price"
                  placeholder="€1000.00"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={(e) => {
                  e.stopPropagation();
                  setEditDialogOpen(false);
                }}
                type="button"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isUpdatingPrice}
              >
                {isUpdatingPrice ? 'Updating...' : 'Update Price'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// --- Add Helper Function --- 
const parseNumericValue = (str: string | null | undefined): number | null => {
  if (str === null || str === undefined) return null;
  try {
    const cleaned = str.replace(/[^\d.,]/g, '');
    const withoutCommas = cleaned.replace(/,/g, '');
    const value = parseFloat(withoutCommas);
    return isNaN(value) ? null : value;
  } catch (error) {
    // console.error(`Error parsing numeric value from string "${str}":`, error); // Optional logging
    return null;
  }
};
// --- End Helper Function ---

export default function NegotiationsPage() {
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  
  // Tanstack Table state
  const [sorting, setSorting] = useState<SortingState>([{ id: "lastActivity", desc: true }]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  
  // Effect to set the page title
  useEffect(() => {
    document.title = "Negotiations | Alterion";
  }, []); // Empty dependency array ensures this runs only once on mount
  
  // Fetch negotiations from Convex
  const convexNegotiations = useQuery(api.negotiations.getUserNegotiations);
  const deleteNegotiation = useMutation(api.negotiations.deleteNegotiation);
  
  // Helper to get numeric price
  const getNumericPrice = (price: string | null | undefined): number => {
    if (!price) return NaN;
    const parsed = parseNumericValue(price);
    return parsed === null ? NaN : parsed;
  };
  
  // Format negotiations data from Convex
  const formatNegotiations = (): Negotiation[] => {
    return (convexNegotiations || []).map((neg) => {
      const initialPriceNum = getNumericPrice(neg.initialRequest.price);
      const currentPriceNum = getNumericPrice(neg.currentPrice || neg.initialRequest.price);
      
      let profit = 0;
      let profitPercentage = 0;
      let profitStr: string | null = null;
      let profitPercentageStr: string | null = null;
      
      // Use stored profit value if available, otherwise calculate
      if (neg.profit !== undefined) {
        profit = neg.profit;
        if (initialPriceNum && initialPriceNum !== 0) {
          profitPercentage = (profit / initialPriceNum) * 100;
        }
      } else if (!isNaN(initialPriceNum) && !isNaN(currentPriceNum)) {
        // Fall back to calculating profit from prices
        profit = currentPriceNum - initialPriceNum; // Positive value when current price > initial price
      } else {
        // Can't calculate profit
        profit = 0;
      }
      
      // Calculate percentage *after* profit is determined
      if (initialPriceNum && initialPriceNum !== 0) {
          profitPercentage = (profit / initialPriceNum) * 100;
      } else {
          profitPercentage = (profit === 0) ? 0 : Infinity * Math.sign(profit);
      }

      // Format the profit and percentage values
      if (isFinite(profitPercentage)) { 
        profitPercentageStr = `${profit >= 0 ? '+' : ''}${profitPercentage.toFixed(1)}%`;
      } else if (profitPercentage > 0) {
        profitPercentageStr = "+∞%";
      } else {
        profitPercentageStr = "-∞%";
      }
      
      profitStr = formatCurrency(profit);

      // Get last activity time
      const lastActivity = neg.updatedAt 
          ? formatDistanceToNow(new Date(neg.updatedAt), { addSuffix: true })
          : 'N/A';

      // Clean return statement
      return {
        id: neg._id,
        offerId: neg.offerId,
        origin: neg.initialRequest.origin,
        destination: neg.initialRequest.destination,
        carrier: neg.initialRequest.carrier,
        initialPrice: formatCurrency(initialPriceNum), // Format numeric value
        currentPrice: formatCurrency(currentPriceNum), // Format numeric value
        profit: profitStr, // Assign calculated profit string
        profitPercentage: profitPercentageStr, // Assign calculated percentage string
        status: neg.status as NegotiationStatus, // Use type assertion
        lastActivity: lastActivity,
        dateCreated: new Date(neg.createdAt).toISOString(), // Use ISO string
        messages: neg.messages?.length ?? 0, // Safely access length
        loadType: neg.initialRequest.loadType,
        aiAssistant: neg.isAgentActive ?? false, // Handle potential undefined
      };
    });
  };
  
  const allNegotiations = useMemo(() => formatNegotiations(), [convexNegotiations]);
  
  // Initialize the table
  const table = useReactTable({
    data: allNegotiations,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      rowSelection,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize,
      },
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newState = updater({ pageIndex: currentPage - 1, pageSize });
        setCurrentPage(newState.pageIndex + 1);
        setPageSize(newState.pageSize);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  
  // Apply search filter whenever searchTerm changes
  useEffect(() => {
    if (searchTerm) {
      table.getColumn("route")?.setFilterValue(searchTerm);
    } else {
      table.getColumn("route")?.setFilterValue(undefined);
    }
  }, [searchTerm, table]);
  
  // Simple refresh function that adds a loading indicator
  const refreshNegotiations = () => {
    setIsRefreshing(true);
    // The actual refresh happens automatically via Convex's reactive queries
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };
  
  // Functions to control the custom modal
  const openCustomModal = () => setIsCustomModalOpen(true);
  const closeCustomModal = () => setIsCustomModalOpen(false);

  const isLoading = convexNegotiations === undefined;
  
  return (
    <div className="w-full px-4 py-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Transport Negotiations</h1>
          <p className="text-muted-foreground">Manage and track all your freight price negotiations</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
            onClick={refreshNegotiations}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            <span>Refresh</span>
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="gap-1"
            onClick={openCustomModal}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Custom Negotiation</span>
          </Button>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by route, carrier..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            {/* Selection Controls - Always present to maintain consistent layout */}
            <div className="h-10 flex items-center">
              {Object.keys(rowSelection).length > 0 ? (
                <div className="flex items-center gap-2 py-1 px-2 bg-muted/50 border rounded-md">
                  <span className="text-sm">
                    {Object.keys(rowSelection).length} selected
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => table.resetRowSelection()}
                    className="h-8 px-2 text-xs"
                  >
                    <Eraser className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete selected negotiations?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the
                          {Object.keys(rowSelection).length === 1 
                            ? " selected negotiation." 
                            : ` ${Object.keys(rowSelection).length} selected negotiations.`}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-red-600 hover:bg-red-700"
                          onClick={async () => {
                            const deleteSelectedNegotiations = async () => {
                              try {
                                setIsRefreshing(true);
                                // Delete each selected negotiation
                                const promises = Object.keys(rowSelection).map(index => {
                                  const negotiationId = table.getRow(index).original.id;
                                  return deleteNegotiation({
                                    negotiationId: negotiationId as unknown as Id<"negotiations">
                                  });
                                });
                                await Promise.all(promises);
                                // Reset selection after deletion
                                table.resetRowSelection();
                              } catch (error) {
                                console.error("Error deleting negotiations:", error);
                              } finally {
                                setIsRefreshing(false);
                              }
                            };
                            
                            deleteSelectedNegotiations();
                          }}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : null}
            </div>
            
            {/* Column Visibility Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Page Size Select */}
            <div className="flex items-center space-x-2">
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => setPageSize(parseInt(value))}
              >
                <SelectTrigger id="page-size-select" className="h-8 w-[70px]">
                  <SelectValue placeholder={pageSize} />
              </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 50, 100].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table style={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    // Get column width from size property
                    const column = header.column.columnDef;
                    const width = 'size' in column ? `${column.size}px` : 'auto';
                    
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan} style={{ width }}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Skeleton Loading Rows - Render based on pageSize
                Array(pageSize).fill(0).map((_, i) => (
                  <TableRow key={`loading-${i}`} className="animate-pulse">
                    {/* We'll render the same number of columns as defined in the columns array */}
                    {columns.map((column, colIndex) => {
                      // Different skeleton content based on column type
                      let skeletonContent;
                      const columnId = column.id || '';
                      const accessorKey = 'accessorKey' in column ? column.accessorKey as string : '';
                      const key = accessorKey || columnId;
                      
                      switch(key) {
                        case "select":
                          skeletonContent = <div className="h-5 w-5 bg-muted rounded"></div>;
                          break;
                        case "id":
                          skeletonContent = <div className="h-4 bg-muted rounded w-16"></div>;
                          break;
                        case "route":
                          skeletonContent = (
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <div className="h-1.5 w-1.5 rounded-full bg-muted mr-1.5"></div>
                                <div className="h-4 bg-muted rounded w-28"></div>
                              </div>
                              <div className="flex items-center">
                                <div className="h-1.5 w-1.5 rounded-full bg-muted mr-1.5"></div>
                                <div className="h-4 bg-muted rounded w-28"></div>
                              </div>
                            </div>
                          );
                          break;
                        case "carrier":
                          skeletonContent = <div className="h-4 bg-muted rounded w-20"></div>;
                          break;
                        case "initialPrice":
                          skeletonContent = <div className="h-4 bg-muted rounded w-16"></div>;
                          break;
                        case "currentPrice":
                          skeletonContent = <div className="h-4 bg-muted rounded w-16"></div>;
                          break;
                        case "profit":
                          skeletonContent = <div className="h-4 bg-muted rounded w-20"></div>;
                          break;
                        case "status":
                          skeletonContent = <div className="h-6 bg-muted rounded w-20"></div>;
                          break;
                        case "lastActivity":
                          skeletonContent = <div className="h-4 bg-muted rounded w-24"></div>;
                          break;
                        case "messages":
                          skeletonContent = <div className="flex items-center gap-1">
                            <div className="h-3.5 w-3.5 rounded-full bg-muted"></div>
                            <div className="h-4 bg-muted rounded w-4"></div>
                          </div>;
                          break;
                        case "actions":
                          skeletonContent = <div className="h-7 bg-muted rounded w-7"></div>;
                          break;
                        default:
                          skeletonContent = <div className="h-4 bg-muted rounded w-16"></div>;
                      }
                      
                      // Get column width from size property
                      const width = 'size' in column ? `${column.size}px` : 'auto';
                      
                      return (
                        <TableCell key={colIndex} style={{ width }}>
                          {skeletonContent}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                // Render actual rows with consistent column widths
                table.getRowModel().rows.map((row) => (
                  <TableRow 
                    key={row.id}
                    className="hover:bg-muted/50 transition-colors"
                    onClick={(e) => {
                      // Check if click is in the first cell (checkbox column)
                      const target = e.target as HTMLElement;
                      const isCheckboxCell = target.closest('td') === 
                        e.currentTarget.querySelector('td:first-child');
                      
                      // Only navigate if not clicking the checkbox cell
                      if (!isCheckboxCell) {
                        window.location.href = `/negotiations/${row.original.id}`;
                      }
                    }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      // Get column width from size property
                      const column = cell.column.columnDef;
                      const width = 'size' in column ? `${column.size}px` : 'auto';
                      
                      return (
                        <TableCell key={cell.id} style={{ width }}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                // No results found - Enhanced with CTA
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center p-6">
                      <h3 className="text-lg font-medium mb-2">No negotiations found</h3>
                      <p className="text-muted-foreground mb-6">Start by requesting transport for an offer</p>
                      <Link href="/offers">
                        <Button>Find Transport Offers</Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Render Pagination only if not loading AND there are items OR page count > 0 */}
      {!isLoading && table.getPageCount() > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {Object.keys(rowSelection).length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="h-8 px-2"
                title="First page"
              >
               <ChevronFirst className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-8 px-2"
                title="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-8 px-2"
                title="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="h-8 px-2"
                title="Last page"
              >
                <ChevronLast className="h-4 w-4" />
              </Button>
          </div>
        </div>
      )}
      <CustomNegotiationModal 
        isOpen={isCustomModalOpen}
        onClose={closeCustomModal}
      />
    </div>
  );
} 