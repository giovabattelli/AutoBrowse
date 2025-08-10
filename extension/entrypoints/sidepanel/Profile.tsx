import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import type { ProfileProps } from "@/types";

function Profile({
  userInfo,
  isPremium,
  subscriptionStatus,
  currentPeriodEnd,
  loading,
  handleUpgrade,
  handleCancelSubscription,
  handleReactivateSubscription
}: ProfileProps) {

  const formatDate = (timestamp: string | null) => {
    if (!timestamp) return "";
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Welcome, {userInfo?.name}!</h2>
        <p className="text-sm text-muted-foreground">{userInfo?.email}</p>
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium">Subscription Status</span>
          {isPremium ? (
            subscriptionStatus === "canceled" ? (
              <Badge variant="secondary">Canceling</Badge>
            ) : (
              <Badge variant="default">Premium Active</Badge>
            )
          ) : (
            <Badge variant="secondary">Free Plan</Badge>
          )}
        </div>

        {subscriptionStatus === "canceled" && currentPeriodEnd && (
          <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
            Your subscription expires on {formatDate(currentPeriodEnd)}
          </div>
        )}

        {isPremium ? (
          subscriptionStatus === "canceled" ? (
            <Button
              className="w-full"
              variant="default"
              onClick={handleReactivateSubscription}
              disabled={loading}
            >
              {loading ? "Loading..." : "Reactivate Subscription"}
            </Button>
          ) : (
            <Button
              className="w-full"
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={loading}
            >
              {loading ? "Loading..." : "Cancel Subscription"}
            </Button>
          )
        ) : (
          <Button
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white"
            onClick={handleUpgrade}
            disabled={loading}
          >
            {loading ? "Loading..." : "Upgrade to Premium"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default Profile;