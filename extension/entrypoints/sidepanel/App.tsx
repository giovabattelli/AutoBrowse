import { useAuth } from "../lib/use-auth.tsx";
import { API_BASE } from "@/lib/config";
import LoginPage from "./Login.tsx";
import Agent from "./Agent.tsx";
import Profile from "./Profile.tsx";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { useState, useEffect } from "react";
import { checkStripeStatus, createStripeCheckout, cancelSubscription, reactivateSubscription } from "../lib/stripe-api";

function App() {
  const { page, userInfo, handleSignIn } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [checkingPremium, setCheckingPremium] = useState(true);

  useEffect(() => {
    if (userInfo?.email) {
      checkPremiumStatus();

      const handleFocus = () => {
        checkPremiumStatus();
      };

      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    } else {
      setCheckingPremium(false);
    }
  }, [userInfo]);

  const checkPremiumStatus = async () => {
    setCheckingPremium(true);
    try {
      const data = await checkStripeStatus(userInfo.email);
      console.log("Stripe status response:", data);
      setIsPremium(data.status === "active" || data.status === "trialing" || data.status === "canceled");
      setSubscriptionStatus(data.status);
      setCurrentPeriodEnd(data.current_period_end || null);
    } catch (error) {
      console.error("Failed to check premium status:", error);
    } finally {
      setCheckingPremium(false);
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const data = await createStripeCheckout(
        userInfo.email,
        `${API_BASE}/stripe/success`,
        window.location.href
      );
      if (data.checkout_url) {
        await browser.tabs.create({ url: data.checkout_url });
      }
    } catch (error) {
      console.error("Failed to create checkout session:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm("Are you sure you want to cancel your subscription? You'll still have access until the end of your billing period.")) {
      return;
    }

    setLoading(true);
    try {
      await cancelSubscription(userInfo.email);
      await checkPremiumStatus();
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setLoading(true);
    try {
      await reactivateSubscription(userInfo.email);
      await checkPremiumStatus();
    } catch (error) {
      console.error("Failed to reactivate subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  return page === "login" ? (
    <LoginPage onSignIn={handleSignIn} />
  ) : (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center">
          <img
            src="/opero-labs-logo.png"
            alt="Opero Labs"
            className="h-8 w-7 mr-3 object-contain"
          />
          <span className="text-lg font-semibold">Opero Labs</span>
          {isPremium && (
            <Badge className="ml-2" variant="default">
              Premium
            </Badge>
          )}
        </div>
        {!isPremium && (
          <Button
            size="sm"
            onClick={handleUpgrade}
            disabled={loading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
          >
            {loading ? "Loading..." : "Upgrade"}
          </Button>
        )}
      </div>
      <Tabs defaultValue="agent" className="flex flex-col flex-1 overflow-hidden">
        <TabsList className="flex-shrink-0 grid w-full grid-cols-2 hover:cursor-pointer border-b rounded-none bg-background">
          <TabsTrigger value="agent">Agent</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>
        <TabsContent value="agent" className="flex-1 mt-0 overflow-hidden flex flex-col">
          <Agent isPremium={isPremium} checkingPremium={checkingPremium} />
        </TabsContent>
        <TabsContent value="profile" className="h-full mt-0 p-4 overflow-auto">
          <Profile
            userInfo={userInfo}
            isPremium={isPremium}
            subscriptionStatus={subscriptionStatus}
            currentPeriodEnd={currentPeriodEnd}
            loading={loading}
            handleUpgrade={handleUpgrade}
            handleCancelSubscription={handleCancelSubscription}
            handleReactivateSubscription={handleReactivateSubscription}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;
