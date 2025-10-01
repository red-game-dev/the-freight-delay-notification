/**
 * Home Page / Dashboard Landing
 */

import Link from 'next/link';
import { Package, Activity, Bell, Workflow, ArrowRight } from 'lucide-react';

const features = [
  {
    name: 'Deliveries',
    description: 'Monitor and manage all freight deliveries in real-time',
    href: '/deliveries',
    icon: Package,
  },
  {
    name: 'Monitoring',
    description: 'Track traffic conditions and detect potential delays',
    href: '/monitoring',
    icon: Activity,
  },
  {
    name: 'Notifications',
    description: 'View sent notifications and delivery confirmations',
    href: '/notifications',
    icon: Bell,
  },
  {
    name: 'Workflows',
    description: 'Monitor Temporal workflow executions and their status',
    href: '/workflows',
    icon: Workflow,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-4">
            Freight Delay Notification System
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Proactively notify customers about delivery delays using real-time traffic data,
            AI-generated messages, and automated workflows.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-16">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.name}
                href={feature.href}
                className="group relative rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-semibold mb-2">{feature.name}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Link>
            );
          })}
        </div>

        <div className="rounded-lg border bg-card p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">How It Works</h2>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold mb-3">
                1
              </div>
              <h3 className="font-semibold mb-2">Traffic Check</h3>
              <p className="text-sm text-muted-foreground">
                Monitor real-time traffic conditions on delivery routes
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-bold mb-3">
                2
              </div>
              <h3 className="font-semibold mb-2">Threshold Check</h3>
              <p className="text-sm text-muted-foreground">
                Compare delays against configurable thresholds
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-bold mb-3">
                3
              </div>
              <h3 className="font-semibold mb-2">AI Message</h3>
              <p className="text-sm text-muted-foreground">
                Generate personalized notifications using AI
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-bold mb-3">
                4
              </div>
              <h3 className="font-semibold mb-2">Notify Customer</h3>
              <p className="text-sm text-muted-foreground">
                Send notifications via email and SMS
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
