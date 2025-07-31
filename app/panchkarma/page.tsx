"use client";

import { PanchkarmaProcessesList } from "@/components/panchkarma-processes-list";

export default function PanchkarmaPage() {
	return (
		<div className='container mx-auto py-6 px-4 sm:px-6 space-y-4'>
			<div className='mb-6'>
				<h1 className='text-3xl font-bold'>Panchkarma Processes</h1>
				<p className='text-muted-foreground'>
					Manage your saved Panchkarma processes
				</p>
			</div>
			<PanchkarmaProcessesList />
		</div>
	);
}
