"use client";

import { ChiefComplaintsList } from "@/components/chief-complaints-list";

export default function ChiefComplaintsPage() {
	return (
		<div className="container mx-auto py-6 px-4 sm:px-6 space-y-4">
			<div className='mb-6'>
				<h1 className='text-3xl font-bold'>Chief Complaints</h1>
				<p className='text-muted-foreground'>
					Manage your saved chief complaints
				</p>
			</div>
			<ChiefComplaintsList />
		</div>
	);
}
