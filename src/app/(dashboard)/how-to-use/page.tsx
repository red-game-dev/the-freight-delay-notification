/**
 * How to Use Page - Comprehensive guide for using the application
 */

import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bell,
  CheckCircle,
  Clock,
  MapPin,
  Package,
  PlayCircle,
  Plus,
  Settings,
  StopCircle,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function HowToUsePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">How to Use This App</h1>
        <p className="text-muted-foreground">
          A comprehensive guide to managing freight deliveries and automated
          delay notifications
        </p>
      </div>

      {/* Quick Start */}
      <Card className="mb-8 p-6">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <PlayCircle className="h-6 w-6 text-primary" />
          Quick Start
        </h2>
        <ol className="space-y-4">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold flex-shrink-0">
              1
            </span>
            <div>
              <strong>Create a Delivery:</strong> Navigate to the Deliveries
              page and click &quot;Create Delivery&quot;. Fill in customer
              details, origin, destination, and expected delivery time.
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold flex-shrink-0">
              2
            </span>
            <div>
              <strong>Configure Thresholds:</strong> Go to Settings to configure
              delay thresholds. Set how many minutes of delay should trigger
              notifications.
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold flex-shrink-0">
              3
            </span>
            <div>
              <strong>Monitor Automatically:</strong> The system will
              automatically check traffic conditions and send notifications when
              delays exceed your configured thresholds.
            </div>
          </li>
        </ol>
      </Card>

      {/* Main Features */}
      <div className="space-y-8 mb-8">
        {/* Deliveries Section */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold">Deliveries</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Creating a Delivery</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                <li>
                  Click the <Plus className="h-4 w-4 inline" /> &quot;Create
                  Delivery&quot; button
                </li>
                <li>Enter customer information (name, email, phone number)</li>
                <li>Specify the origin address (pickup location)</li>
                <li>Specify the destination address (delivery location)</li>
                <li>Set the expected delivery time</li>
                <li>Save the delivery to start automatic monitoring</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Managing Deliveries</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                <li>
                  View all deliveries in the table with status, origin, and
                  destination
                </li>
                <li>Click on any delivery to view detailed information</li>
                <li>Edit delivery details using the &quot;Edit&quot; button</li>
                <li>View delivery route on an interactive map</li>
                <li>
                  See all workflows and notifications associated with the
                  delivery
                </li>
                <li>Start or stop recurring traffic checks manually</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Delivery Statuses</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-xs">
                    Pending
                  </span>
                  <span className="text-muted-foreground">Not yet started</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs">
                    In Transit
                  </span>
                  <span className="text-muted-foreground">
                    Currently being delivered
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs">
                    Delayed
                  </span>
                  <span className="text-muted-foreground">
                    Experiencing significant delays
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs">
                    Delivered
                  </span>
                  <span className="text-muted-foreground">
                    Successfully completed
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/deliveries">
                <Button
                  variant="outline"
                  size="sm"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Go to Deliveries
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Monitoring Section */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold">Traffic Monitoring</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">How It Works</h3>
              <p className="text-sm text-muted-foreground mb-3">
                The system continuously monitors traffic conditions on all
                active delivery routes using real-time data. When traffic
                conditions cause delays beyond your configured thresholds, the
                system automatically generates and sends notifications to
                customers.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Traffic Conditions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Normal:</span>
                  <span className="text-muted-foreground">No delays</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium">Moderate:</span>
                  <span className="text-muted-foreground">Minor delays</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Heavy:</span>
                  <span className="text-muted-foreground">
                    Significant delays
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="font-medium">Severe:</span>
                  <span className="text-muted-foreground">Critical delays</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Monitoring Features</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                <li>View real-time traffic updates for all routes</li>
                <li>See current delay duration for each route</li>
                <li>Track when traffic data was last updated</li>
                <li>View historical traffic patterns</li>
                <li>Filter by traffic condition severity</li>
              </ul>
            </div>

            <div className="pt-2">
              <Link href="/monitoring">
                <Button
                  variant="outline"
                  size="sm"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Go to Monitoring
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Notifications Section */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
              <Bell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Automatic Notifications</h3>
              <p className="text-sm text-muted-foreground mb-3">
                When delays are detected, the system automatically generates
                personalized notification messages using AI and sends them to
                customers via email and SMS. All notifications are logged and
                can be reviewed in the Notifications page.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Notification Details</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                <li>View all sent notifications with timestamps</li>
                <li>See notification status (pending, sent, failed)</li>
                <li>Review the message content sent to customers</li>
                <li>Filter by delivery or notification type</li>
                <li>Track which channel was used (email/SMS)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Notification Types</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Delay Notification:</span>
                  <span className="text-muted-foreground ml-2">
                    Sent when traffic delays exceed thresholds
                  </span>
                </div>
                <div>
                  <span className="font-medium">Delivery Confirmation:</span>
                  <span className="text-muted-foreground ml-2">
                    Sent when delivery is completed
                  </span>
                </div>
                <div>
                  <span className="font-medium">Status Update:</span>
                  <span className="text-muted-foreground ml-2">
                    Sent when delivery status changes
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/notifications">
                <Button
                  variant="outline"
                  size="sm"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Go to Notifications
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Workflows Section */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
              <Workflow className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-xl font-semibold">Workflows</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What are Workflows?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Workflows are automated processes managed by Temporal that
                handle traffic monitoring and notification delivery. Each
                delivery can have multiple workflows assigned to it for
                different purposes.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Workflow Types</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Recurring Check:</span>
                  <span className="text-muted-foreground ml-2">
                    Periodically checks traffic conditions (e.g., every 15
                    minutes)
                  </span>
                </div>
                <div>
                  <span className="font-medium">One-Time Check:</span>
                  <span className="text-muted-foreground ml-2">
                    Manual traffic check triggered on demand
                  </span>
                </div>
                <div>
                  <span className="font-medium">Scheduled Check:</span>
                  <span className="text-muted-foreground ml-2">
                    Runs at specific time before expected delivery
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Workflow Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <PlayCircle className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Running:</span>
                  <span className="text-muted-foreground">
                    Currently active
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Completed:</span>
                  <span className="text-muted-foreground">
                    Finished successfully
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="font-medium">Failed:</span>
                  <span className="text-muted-foreground">
                    Encountered error
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StopCircle className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">Cancelled:</span>
                  <span className="text-muted-foreground">
                    Manually stopped
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Managing Workflows</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                <li>View all workflow executions across deliveries</li>
                <li>Monitor workflow status and progress</li>
                <li>See when workflows were started and completed</li>
                <li>Review workflow run history and results</li>
                <li>Manually trigger traffic checks for specific deliveries</li>
              </ul>
            </div>

            <div className="pt-2">
              <Link href="/workflows">
                <Button
                  variant="outline"
                  size="sm"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Go to Workflows
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Settings Section */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold">Settings</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Threshold Configuration</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Configure when the system should send delay notifications based
                on traffic conditions. The threshold is measured in minutes of
                additional delay compared to normal traffic.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Configurable Options</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                <li>
                  <strong>Delay Threshold:</strong> Minimum delay in minutes to
                  trigger notification
                </li>
                <li>
                  <strong>Check Interval:</strong> How often to check traffic
                  (for recurring workflows)
                </li>
                <li>
                  <strong>Notification Channels:</strong> Enable/disable email
                  and SMS
                </li>
                <li>
                  <strong>AI Settings:</strong> Configure notification message
                  generation
                </li>
              </ul>
            </div>

            <div className="pt-2">
              <Link href="/settings">
                <Button
                  variant="outline"
                  size="sm"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Go to Settings
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Tips and Best Practices */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Tips and Best Practices
        </h2>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <span>
              Set realistic delay thresholds based on your delivery routes and
              customer expectations
            </span>
          </li>
          <li className="flex gap-2">
            <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <span>
              Double-check addresses when creating deliveries to ensure accurate
              route calculations
            </span>
          </li>
          <li className="flex gap-2">
            <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <span>
              Review sent notifications regularly to ensure customers are
              receiving appropriate updates
            </span>
          </li>
          <li className="flex gap-2">
            <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <span>
              Monitor the Workflows page to ensure automated checks are running
              as expected
            </span>
          </li>
          <li className="flex gap-2">
            <Package className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <span>
              Update delivery status manually when needed (e.g., mark as
              delivered when confirmed)
            </span>
          </li>
        </ul>
      </Card>

      {/* Footer Navigation */}
      <div className="mt-8 pt-6 border-t flex justify-between items-center">
        <Link href="/">
          <Button variant="ghost">← Back to Dashboard</Button>
        </Link>
        <Link href="/settings">
          <Button variant="primary">Configure Settings →</Button>
        </Link>
      </div>
    </div>
  );
}
