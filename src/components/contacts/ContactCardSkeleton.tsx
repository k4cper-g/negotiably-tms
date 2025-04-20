import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ContactCardSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4">
        {/* Avatar Skeleton */}
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          {/* Name Skeleton */}
          <Skeleton className="h-5 w-3/4" />
          {/* Company Skeleton */}
          <Skeleton className="h-4 w-1/2" />
        </div>
        {/* More Options Button Skeleton */}
        <Skeleton className="h-8 w-8" />
      </CardHeader>
      <CardContent className="flex-grow space-y-3 text-sm">
        {/* Email Skeleton */}
        <div className="flex items-center gap-2">
           <Skeleton className="h-4 w-4 flex-shrink-0" />
           <Skeleton className="h-4 w-full" />
        </div>
        {/* Phone Skeleton */}
        <div className="flex items-center gap-2">
           <Skeleton className="h-4 w-4 flex-shrink-0" />
           <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
      <CardFooter>
        {/* Footer Badge/Text Skeleton */}
        <Skeleton className="h-5 w-1/3" />
      </CardFooter>
    </Card>
  );
} 