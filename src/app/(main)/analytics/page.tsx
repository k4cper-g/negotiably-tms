import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, CalendarIcon, Download, PieChart, TrendingDown, TrendingUp } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <div className="flex items-center gap-2">
          <Select defaultValue="30days">
            <SelectTrigger className="w-[180px]">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="ml-auto">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Savings
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€47,350</div>
            <p className="text-xs text-muted-foreground">
              +10.1% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Saving Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.6%</div>
            <p className="text-xs text-muted-foreground">
              +1.2% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Transports
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">148</div>
            <p className="text-xs text-muted-foreground">
              +12 from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Transport Price
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€1,245</div>
            <p className="text-xs text-muted-foreground">
              -3.5% from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <Tabs defaultValue="savings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="savings">Savings</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="performance">AI Performance</TabsTrigger>
          <TabsTrigger value="carriers">Carriers</TabsTrigger>
        </TabsList>

        <TabsContent value="savings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Monthly Savings</CardTitle>
                <CardDescription>
                  Total cost savings achieved by AI negotiations over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="h-full w-full flex items-center justify-center bg-muted/30 rounded-md">
                  <div className="text-center">
                    <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-medium">Savings Chart</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Bar chart showing monthly savings
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Savings Distribution</CardTitle>
                <CardDescription>
                  Breakdown of savings by transport category
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="h-full w-full flex items-center justify-center bg-muted/30 rounded-md">
                  <div className="text-center">
                    <PieChart className="mx-auto h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-medium">Distribution Chart</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pie chart showing savings distribution by category
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Savings by Route</CardTitle>
              <CardDescription>
                Top routes with the highest cost savings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-4 text-left font-medium">Route</th>
                      <th className="py-3 px-4 text-left font-medium">Total Transports</th>
                      <th className="py-3 px-4 text-left font-medium">Average Price</th>
                      <th className="py-3 px-4 text-left font-medium">Total Savings</th>
                      <th className="py-3 px-4 text-left font-medium">Saving Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-4">Berlin → Paris</td>
                      <td className="py-3 px-4">24</td>
                      <td className="py-3 px-4">€980</td>
                      <td className="py-3 px-4 font-medium text-green-600">€2,160</td>
                      <td className="py-3 px-4 text-green-600">9.2%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Warsaw → Barcelona</td>
                      <td className="py-3 px-4">18</td>
                      <td className="py-3 px-4">€1,720</td>
                      <td className="py-3 px-4 font-medium text-green-600">€3,600</td>
                      <td className="py-3 px-4 text-green-600">11.6%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Munich → Vienna</td>
                      <td className="py-3 px-4">32</td>
                      <td className="py-3 px-4">€590</td>
                      <td className="py-3 px-4 font-medium text-green-600">€2,240</td>
                      <td className="py-3 px-4 text-green-600">11.9%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Amsterdam → Milan</td>
                      <td className="py-3 px-4">15</td>
                      <td className="py-3 px-4">€1,340</td>
                      <td className="py-3 px-4 font-medium text-green-600">€2,400</td>
                      <td className="py-3 px-4 text-green-600">11.9%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Prague → Madrid</td>
                      <td className="py-3 px-4">12</td>
                      <td className="py-3 px-4">€1,850</td>
                      <td className="py-3 px-4 font-medium text-green-600">€2,760</td>
                      <td className="py-3 px-4 text-green-600">12.4%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Popular Routes</CardTitle>
              <CardDescription>
                Most frequently used transport routes
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <div className="h-full w-full flex items-center justify-center bg-muted/30 rounded-md">
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted-foreground">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                    <path d="M2 12h20" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium">Europe Map</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md">
                    Interactive map showing transport routes across Europe with line thickness indicating volume
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>AI Performance Metrics</CardTitle>
                <CardDescription>
                  Negotiation success rates over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="h-full w-full flex items-center justify-center bg-muted/30 rounded-md">
                  <div className="text-center">
                    <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-medium">Performance Chart</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Line chart showing AI negotiation success rate over time
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Negotiation Strategies</CardTitle>
                <CardDescription>
                  Performance of different AI negotiation approaches
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="h-full w-full flex items-center justify-center bg-muted/30 rounded-md">
                  <div className="text-center">
                    <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-medium">Strategy Comparison</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Bar chart comparing different negotiation strategies
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>AI Strategy Performance</CardTitle>
              <CardDescription>
                Detailed breakdown of negotiation success by strategy type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-4 text-left font-medium">Strategy</th>
                      <th className="py-3 px-4 text-left font-medium">Usage Count</th>
                      <th className="py-3 px-4 text-left font-medium">Success Rate</th>
                      <th className="py-3 px-4 text-left font-medium">Avg. Price Reduction</th>
                      <th className="py-3 px-4 text-left font-medium">Avg. Negotiation Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-4">Value-based negotiation</td>
                      <td className="py-3 px-4">68</td>
                      <td className="py-3 px-4 text-green-600">89%</td>
                      <td className="py-3 px-4">9.2%</td>
                      <td className="py-3 px-4">24 min</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Volume discount focus</td>
                      <td className="py-3 px-4">42</td>
                      <td className="py-3 px-4 text-green-600">92%</td>
                      <td className="py-3 px-4">11.5%</td>
                      <td className="py-3 px-4">35 min</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Market comparison</td>
                      <td className="py-3 px-4">37</td>
                      <td className="py-3 px-4 text-green-600">78%</td>
                      <td className="py-3 px-4">7.8%</td>
                      <td className="py-3 px-4">18 min</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Relationship building</td>
                      <td className="py-3 px-4">26</td>
                      <td className="py-3 px-4 text-green-600">94%</td>
                      <td className="py-3 px-4">8.4%</td>
                      <td className="py-3 px-4">42 min</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Aggressive bargaining</td>
                      <td className="py-3 px-4">14</td>
                      <td className="py-3 px-4 text-amber-600">65%</td>
                      <td className="py-3 px-4">14.2%</td>
                      <td className="py-3 px-4">28 min</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="carriers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Carrier Performance</CardTitle>
              <CardDescription>
                Analysis of carrier responsiveness and pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-4 text-left font-medium">Carrier</th>
                      <th className="py-3 px-4 text-left font-medium">Total Transports</th>
                      <th className="py-3 px-4 text-left font-medium">Avg. Response Time</th>
                      <th className="py-3 px-4 text-left font-medium">Avg. Initial Price</th>
                      <th className="py-3 px-4 text-left font-medium">Avg. Final Price</th>
                      <th className="py-3 px-4 text-left font-medium">Price Flexibility</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-4">SpeedFreight Ltd.</td>
                      <td className="py-3 px-4">34</td>
                      <td className="py-3 px-4">15 min</td>
                      <td className="py-3 px-4">€1,420</td>
                      <td className="py-3 px-4">€1,290</td>
                      <td className="py-3 px-4 text-green-600">High</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">ExpressLogistics GmbH</td>
                      <td className="py-3 px-4">28</td>
                      <td className="py-3 px-4">22 min</td>
                      <td className="py-3 px-4">€1,180</td>
                      <td className="py-3 px-4">€1,080</td>
                      <td className="py-3 px-4 text-green-600">Medium</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">AlpineTransport</td>
                      <td className="py-3 px-4">22</td>
                      <td className="py-3 px-4">35 min</td>
                      <td className="py-3 px-4">€980</td>
                      <td className="py-3 px-4">€920</td>
                      <td className="py-3 px-4 text-yellow-600">Medium</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">EuroMovers B.V.</td>
                      <td className="py-3 px-4">18</td>
                      <td className="py-3 px-4">12 min</td>
                      <td className="py-3 px-4">€1,240</td>
                      <td className="py-3 px-4">€1,090</td>
                      <td className="py-3 px-4 text-green-600">High</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">SpeedCargo</td>
                      <td className="py-3 px-4">14</td>
                      <td className="py-3 px-4">45 min</td>
                      <td className="py-3 px-4">€1,520</td>
                      <td className="py-3 px-4">€1,480</td>
                      <td className="py-3 px-4 text-red-600">Low</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 