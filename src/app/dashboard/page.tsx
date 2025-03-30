import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  Truck,
  BarChart,
  Filter,
  RefreshCcw,
} from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
  // Dummy data for demonstration
  const metrics = [
    {
      title: "Total Loads",
      value: "148",
      change: "+12%",
      icon: <Truck className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Active Negotiations",
      value: "24",
      change: "+8%",
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Avg. Savings",
      value: "€320",
      change: "+10.2%",
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Total Savings",
      value: "€47,350",
      change: "+16.8%",
      icon: <BarChart className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  const recentOffers = [
    {
      id: "TR-2587",
      origin: "Warsaw, PL",
      destination: "Barcelona, ES",
      price: "€1,720",
      negotiatedPrice: "€1,520",
      savings: "€200",
      status: "Negotiating",
      date: "Today, 14:35",
      platform: "TimoCom",
    },
    {
      id: "TR-2586",
      origin: "Berlin, DE",
      destination: "Paris, FR",
      price: "€980",
      negotiatedPrice: "€890",
      savings: "€90",
      status: "Accepted",
      date: "Today, 12:20",
      platform: "Trans.eu",
    },
    {
      id: "TR-2585",
      origin: "Munich, DE",
      destination: "Vienna, AT",
      price: "€590",
      negotiatedPrice: "€520",
      savings: "€70",
      status: "Countered",
      date: "Today, 10:15",
      platform: "Freightos",
    },
    {
      id: "TR-2584",
      origin: "Amsterdam, NL",
      destination: "Milan, IT",
      price: "€1,340",
      negotiatedPrice: "€1,180",
      savings: "€160",
      status: "Completed",
      date: "Yesterday",
      platform: "TimoCom",
    },
    {
      id: "TR-2583",
      origin: "Prague, CZ",
      destination: "Madrid, ES",
      price: "€1,850",
      negotiatedPrice: "€1,620",
      savings: "€230",
      status: "Completed",
      date: "Yesterday",
      platform: "Trans.eu",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <RefreshCcw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          <Button size="sm" className="gap-1">
            <Truck className="h-4 w-4" />
            <span>New Transport</span>
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium leading-none text-muted-foreground">
                  {metric.title}
                </p>
                {metric.icon}
              </div>
              <div className="flex items-center gap-3">
                <p className="text-2xl font-bold">{metric.value}</p>
                <div className="flex items-center text-xs text-green-500">
                  {metric.change}
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <TabsList>
            <TabsTrigger value="all">All Offers</TabsTrigger>
            <TabsTrigger value="negotiating">Negotiating</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Input 
                placeholder="Search offers..." 
                className="pl-8 w-full md:w-64" 
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transport Offers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="py-3 px-4 text-left font-medium">ID</th>
                        <th className="py-3 px-4 text-left font-medium">Route</th>
                        <th className="py-3 px-4 text-left font-medium">Platform</th>
                        <th className="py-3 px-4 text-left font-medium">Initial Price</th>
                        <th className="py-3 px-4 text-left font-medium">Negotiated</th>
                        <th className="py-3 px-4 text-left font-medium">Savings</th>
                        <th className="py-3 px-4 text-left font-medium">Status</th>
                        <th className="py-3 px-4 text-left font-medium">Date</th>
                        <th className="py-3 px-4 text-left font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOffers.map((offer) => (
                        <tr key={offer.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{offer.id}</td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <div className="flex items-center">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-1.5"></span>
                                {offer.origin}
                              </div>
                              <div className="flex items-center mt-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5"></span>
                                {offer.destination}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">{offer.platform}</td>
                          <td className="py-3 px-4">{offer.price}</td>
                          <td className="py-3 px-4 font-medium text-green-600">{offer.negotiatedPrice}</td>
                          <td className="py-3 px-4 text-green-600">{offer.savings}</td>
                          <td className="py-3 px-4">
                            <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                              ${
                                offer.status === "Negotiating"
                                  ? "bg-blue-100 text-blue-800"
                                  : offer.status === "Accepted"
                                  ? "bg-green-100 text-green-800"
                                  : offer.status === "Countered"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-neutral-100 text-neutral-800"
                              }
                            `}>
                              {offer.status}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{offer.date}</td>
                          <td className="py-3 px-4">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">View details</span>
                              <ArrowUpRight className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 