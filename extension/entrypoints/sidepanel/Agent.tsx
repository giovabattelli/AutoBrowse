import { useState, useEffect, useRef } from "react";
import { agentState } from "../lib/agent/state";
import { parseHistorySteps } from "../lib/agent/history";
import { fetchAgentStatus } from "../lib/agent/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { API_BASE } from "@/lib/config";
import type { HistoryStep, AgentMessage, AgentProps } from "@/types";
import JobApplicationForm from "./JobApplicationForm";
import type { JobApplicationData } from "@/types";

function Agent({ isPremium: isPremiumProp, checkingPremium }: AgentProps) {
    const [prompt, setPrompt] = useState("");
    const [messages, setMessages] = useState<AgentMessage[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [currentHistory, setCurrentHistory] = useState<string | null>(null);
    const [agentMode, setAgentMode] = useState<string>("default");
    const [showJobApplicationForm, setShowJobApplicationForm] = useState(false);
    const [jobApplicationData, setJobApplicationData] = useState<JobApplicationData | null>(null);
    const [runsRemaining, setRunsRemaining] = useState<number | string>(isPremiumProp ? "unlimited" : "");
    const [isPremium, setIsPremium] = useState(isPremiumProp);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const checkAgentState = async () => {
            const state = await agentState.getValue();
            setIsRunning(state.isRunning);

            if (state.history !== currentHistory) {
                setCurrentHistory(state.history);
                const steps = parseHistorySteps(state.history);
                updateMessagesFromHistory(steps, state.originalPrompt ?? state.prompt);
            }
        };

        checkAgentState();

        const interval = setInterval(checkAgentState, 500);
        return () => clearInterval(interval);
    }, [currentHistory]);

    useEffect(() => {
        setIsPremium(isPremiumProp);
        if (isPremiumProp) {
            setRunsRemaining("unlimited");
        }
    }, [isPremiumProp]);

    useEffect(() => {
        const fetchStatusOnMount = async () => {
            const { userInfo } = await browser.storage.local.get("userInfo");
            if (userInfo?.email) {
                try {
                    const status = await fetchAgentStatus(userInfo.email);
                    setRunsRemaining(status.runs_remaining);
                    setIsPremium(status.is_premium);
                } catch (error) {
                    console.error("Failed to fetch agent status on mount:", error);
                }
            }
        };

        fetchStatusOnMount();
    }, []);

    useEffect(() => {
        const checkAgentStatus = async () => {
            const { userInfo } = await browser.storage.local.get("userInfo");
            if (userInfo?.email) {
                try {
                    const status = await fetchAgentStatus(userInfo.email);
                    setRunsRemaining(status.runs_remaining);
                    setIsPremium(status.is_premium);
                } catch (error) {
                    console.error("Failed to fetch agent status:", error);
                }
            }
        };

        if (!isRunning && currentHistory) {
            checkAgentStatus();
        }
    }, [isRunning, currentHistory]);

    const updateMessagesFromHistory = (
        steps: HistoryStep[],
        userPrompt: string | null,
    ) => {
        const newMessages: AgentMessage[] = [];

        if (userPrompt) {
            newMessages.push({
                id: "user-0",
                type: "user",
                content: userPrompt,
                metadata: { timestamp: Date.now() },
            });
        }

        steps.forEach((step) => {
            const actionDescriptions: Record<string, string> = {
                click: "🖱️ Clicked",
                input: "⌨️ Typed",
                key_press: "🔤 Pressed key",
                scroll: "📜 Scrolled",
                finish: "✅ Completed",
                upload: "📎 Uploaded file",
            };

            let content = `${actionDescriptions[step.action] || step.action}`;

            if (step.action === "click") {
                content += ` element`;
            } else if (step.action === "input") {
                content += ` "${step.value}" into element`;
            } else if (step.action === "key_press") {
                content += ` "${step.value}" on element`;
            } else if (step.action === "scroll") {
                content += ` ${step.value}`;
            } else if (step.action === "finish") {
                content += `: ${step.value}`;
            } else if (step.action === "upload") {
                content += ` ${step.value} to element`;
            }

            if (step.summary) {
                content += `\n\n${step.summary}`;
            }

            newMessages.push({
                id: `agent-${step.step_number}`,
                type: step.action === "finish" ? "system" : "agent",
                content,
                metadata: {
                    action: step.action,
                    value: step.value || undefined,
                    timestamp: Date.now(),
                },
            });
        });

        setMessages(newMessages);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleRunAgent = async (overrideJobData?: JobApplicationData) => {
        if (!prompt) return;

        const newEmptyChromeTabUrl = "chrome://newtab/";

        if (!isPremium && runsRemaining === 0) {
            setMessages((prev) => [
                ...prev,
                {
                    id: `error-${Date.now()}`,
                    type: "system",
                    content: "❌ You've reached your free agent run limit. Please upgrade to premium for unlimited runs.",
                    metadata: { timestamp: Date.now() },
                },
            ]);
            return;
        }

        const jobData = overrideJobData || jobApplicationData;

        if (agentMode === "job_application" && !jobData) {
            setShowJobApplicationForm(true);
            return;
        }

        const [tab] = await browser.tabs.query({
            active: true,
            currentWindow: true,
        });

        if (tab?.url?.includes(newEmptyChromeTabUrl)) {
            await browser.tabs.update({ url: "https://www.google.com" });
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        if (tab?.id) {
            setMessages([
                {
                    id: "user-0",
                    type: "user",
                    content: prompt,
                    metadata: { timestamp: Date.now() },
                },
            ]);

            setMessages((prev) => [
                ...prev,
                {
                    id: "system-start",
                    type: "system",
                    content: "🤖 Starting agent...",
                    metadata: { timestamp: Date.now() },
                },
            ]);

            let enrichedPrompt = prompt;
            const { isEnriched, prompt: existingPrompt } = await agentState.getValue();

            if (!isEnriched) {
                try {
                    const requestBody: any = { prompt, agentMode };

                    if (agentMode === "job_application" && jobData) {
                        requestBody.jobApplicationData = jobData;
                    }

                    const response = await fetch(`${API_BASE}/enrich`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(requestBody),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        enrichedPrompt = data.prompt;
                        console.log("Enriched prompt:", enrichedPrompt);
                    } else {
                        console.warn("Enrichment request failed, using original prompt");
                    }
                } catch (error) {
                    console.error("Error during enrichment, using original prompt:", error);
                }
            } else {
                enrichedPrompt = existingPrompt || prompt;
                console.log("Using existing enriched prompt");
            }

            await agentState.setValue({
                isRunning: true,
                prompt: enrichedPrompt,
                history: null,
                tabId: tab.id,
                isEnriched: true,
                originalPrompt: prompt,
                agentMode: agentMode,
                jobApplicationData: jobData,
            });
            await browser.runtime.sendMessage({ type: "runAgent" });
        }
    };

    const handleResetAgent = async () => {
        await agentState.setValue({
            isRunning: false,
            prompt: null,
            history: null,
            tabId: null,
            isEnriched: false,
            originalPrompt: null,
            agentMode: "default",
            jobApplicationData: null,
        });
        setMessages([]);
        setCurrentHistory(null);
        setPrompt("");
        setJobApplicationData(null);
        setAgentMode("default");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleRunAgent();
        }
    };

    const renderEmptyState = (mode: string) => {
        if (mode === "default")
            return (
                <div className="text-sm space-y-2">
                    <p>
                        Nothing to display. Enter a prompt below to start your <strong>default agent</strong>.
                    </p>
                    <p className="text-xs text-muted-foreground">Good for:</p>
                    <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1">
                        <li>General web exploration</li>
                        <li>Research &amp; data gathering</li>
                        <li>Automating broad browser tasks</li>
                    </ul>
                </div>
            );

        if (mode === "social_media")
            return (
                <div className="text-sm space-y-2">
                    <p>
                        Nothing to display. Enter a prompt below to start your <strong>social media agent</strong>.
                    </p>
                    <p className="text-xs text-muted-foreground">Good for:</p>
                    <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1">
                        <li>
                            Auto interacting: scrolling, commenting, etc.
                        </li>
                        <li>Drafting posts and captions</li>
                        <li>Using your preferences &amp; style when interacting with others</li>
                    </ul>
                </div>
            );

        if (mode === "job_application")
            return (
                <div className="text-sm space-y-2">
                    <p>
                        Nothing to display. Enter a prompt below to start your <strong>job application agent</strong>.
                    </p>
                    <p className="text-xs text-muted-foreground">Good for:</p>
                    <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1">
                        <li>Automatically filling out job application forms</li>
                        <li>Multi-step application processes</li>
                        <li>Personalizing applications with your info</li>
                    </ul>
                </div>
            );

        return (
            <p className="text-sm">
                Nothing to display. Enter a prompt below to start your agent.
            </p>
        );
    };

    const handleJobApplicationSubmit = (data: JobApplicationData) => {
        setJobApplicationData(data);
        setShowJobApplicationForm(false);
        handleRunAgent(data);
    };

    if (checkingPremium && !showJobApplicationForm) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-sm text-muted-foreground">Loading agent...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col h-full overflow-hidden">
            <ScrollArea className="flex-grow p-0 px-4 relative z-10 scrollbar-chat">
                <div className="space-y-4 pt-4">
                    {messages.length === 0 ? (
                        <Card className="border-solid border-b">
                            <CardContent className="p-6">
                                {renderEmptyState(agentMode)}
                            </CardContent>
                        </Card>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${message.type === "user" ? "flex-row-reverse" : "flex-row"}`}
                            >
                                <Avatar className="h-8 w-8 shrink-0 bg-white shadow-md">
                                    {message.type === "agent" ? (
                                        <AvatarImage
                                            src="/opero-labs-logo.png"
                                            alt="Opero Labs Logo"
                                            className="aspect-square h-full w-full object-contain p-1"
                                        />
                                    ) : message.type === "user" ? (
                                        <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                                            U
                                        </AvatarFallback>
                                    ) : (
                                        <AvatarFallback className="text-xs bg-amber-100 text-amber-600">
                                            S
                                        </AvatarFallback>
                                    )}
                                </Avatar>

                                <Card
                                    className={`max-w-[85%] ${message.type === "user"
                                        ? "bg-blue-50 border-blue-200"
                                        : message.type === "system"
                                            ? "bg-amber-50 border-amber-200"
                                            : "bg-muted"
                                        }`}
                                >
                                    <CardContent className="p-3">
                                        <p className="text-sm whitespace-pre-wrap break-words">
                                            {message.content}
                                        </p>

                                        {message.metadata && message.metadata.action && (
                                            <>
                                                <Separator className="my-2" />
                                                <div className="flex flex-wrap gap-1">
                                                    <Badge
                                                        variant={
                                                            message.metadata.action === "finish"
                                                                ? "default"
                                                                : message.metadata.action === "click"
                                                                    ? "secondary"
                                                                    : message.metadata.action === "input"
                                                                        ? "outline"
                                                                        : "secondary"
                                                        }
                                                        className="text-xs"
                                                    >
                                                        {message.metadata.action}
                                                    </Badge>
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        ))
                    )}

                    {isRunning && (
                        <div className="flex gap-3">
                            <Avatar className="h-8 w-8 shrink-0 bg-white shadow-sm">
                                <AvatarImage
                                    src="/opero-labs-logo.png"
                                    alt="Opero Labs Logo"
                                    className="aspect-square h-full w-full object-contain p-1"
                                />
                            </Avatar>
                            <Card className="bg-muted animate-pulse">
                                <CardContent className="p-3">
                                    <p className="text-sm text-muted-foreground">Agent is thinking...</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            <Card className="rounded-none border-x-0 border-b-0">
                <CardContent className="p-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                                Agent runs remaining:
                                <span className={`ml-1 font-medium ${runsRemaining === 0 ? "text-red-600" : ""}`}>
                                    {runsRemaining === "unlimited" ? "Unlimited" : runsRemaining}
                                </span>
                            </span>
                            {!isPremium && (
                                <Badge variant="secondary" className="text-xs">
                                    Free Plan
                                </Badge>
                            )}
                        </div>
                        <Separator />
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setAgentMode("default")}
                                variant={agentMode === "default" ? "default" : "outline"}
                                size="sm"
                                className="flex-1 text-xs"
                                disabled={isRunning}
                            >
                                Default
                            </Button>
                            <Button
                                onClick={() => setAgentMode("social_media")}
                                variant={agentMode === "social_media" ? "default" : "outline"}
                                size="sm"
                                className="flex-1 text-xs"
                                disabled={isRunning}
                            >
                                Social
                            </Button>
                            <Button
                                onClick={() => setAgentMode("job_application")}
                                variant={agentMode === "job_application" ? "default" : "outline"}
                                size="sm"
                                className="flex-1 text-xs"
                                disabled={isRunning}
                            >
                                Jobs
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Input
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Describe your browser task"
                                className="flex-1 text-sm"
                                disabled={isRunning}
                            />
                            <Button onClick={() => handleRunAgent()} disabled={isRunning || !prompt} size="sm">
                                {isRunning ? "Running..." : "Run"}
                            </Button>
                            <Button onClick={handleResetAgent} variant="outline" size="sm">
                                {isRunning ? "Stop" : "Reset"}
                            </Button>
                        </div>
                    </div>
                    {isRunning && (
                        <div className="mt-2 flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                                Running
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                                Check the page for actions
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <JobApplicationForm
                isOpen={showJobApplicationForm}
                onClose={() => setShowJobApplicationForm(false)}
                onSubmit={handleJobApplicationSubmit}
            />
        </div>
    );
}

export default Agent;