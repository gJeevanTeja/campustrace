import React from 'react';

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded-md ${className}`} />
);

export const ItemSkeleton = () => (
  <div className="bg-white rounded-2xl p-4 border border-border shadow-sm flex gap-4">
    <Skeleton className="w-20 h-20 rounded-xl" />
    <div className="flex-1 space-y-3 py-1">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  </div>
);

export const AnalyticsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="bg-white rounded-2xl p-6 border border-border shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="w-10 h-10 rounded-xl" />
        </div>
        <Skeleton className="h-3 w-24" />
      </div>
    ))}
  </div>
);

export const ChatSkeleton = () => (
    <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <Skeleton className={`h-10 w-48 rounded-2xl ${i % 2 === 0 ? 'bg-primary/20' : 'bg-gray-100'}`} />
            </div>
        ))}
    </div>
)
