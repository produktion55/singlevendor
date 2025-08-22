import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Send, MoreHorizontal, Search, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { type Message } from "@shared/schema";

interface ConversationPreview {
  id: string;
  otherUser: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  type: "support" | "order" | "private";
  orderId?: string;
}

const mockConversations: ConversationPreview[] = [
  {
    id: "conv-1",
    otherUser: "Support Team",
    lastMessage: "Your order has been processed successfully",
    timestamp: "2 min ago",
    unreadCount: 1,
    type: "support",
    orderId: "order-123"
  },
  {
    id: "conv-2", 
    otherUser: "Admin",
    lastMessage: "Thank you for your purchase",
    timestamp: "1 hour ago",
    unreadCount: 0,
    type: "order",
    orderId: "order-456"
  },
  {
    id: "conv-3",
    otherUser: "Sales Department",
    lastMessage: "We've received your refund request",
    timestamp: "3 hours ago",
    unreadCount: 2,
    type: "support"
  }
];

const mockMessages = [
  {
    id: "msg-1",
    senderId: "support-1",
    content: "Hello! How can I help you today?",
    timestamp: "10:30 AM",
    isOwn: false
  },
  {
    id: "msg-2", 
    senderId: "user-1",
    content: "I have a question about my recent order",
    timestamp: "10:32 AM",
    isOwn: true
  },
  {
    id: "msg-3",
    senderId: "support-1", 
    content: "I'd be happy to help! Can you provide your order ID?",
    timestamp: "10:33 AM",
    isOwn: false
  },
  {
    id: "msg-4",
    senderId: "user-1",
    content: "Sure, it's order-123",
    timestamp: "10:34 AM", 
    isOwn: true
  },
  {
    id: "msg-5",
    senderId: "support-1",
    content: "Your order has been processed successfully and is ready for download. You can find it in your profile under the Orders section.",
    timestamp: "10:35 AM",
    isOwn: false
  }
];

export function Messages() {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string>("conv-1");
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const getConversationTypeBadge = (type: string) => {
    switch (type) {
      case "support":
        return <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">Support</Badge>;
      case "order":
        return <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Order</Badge>;
      case "private":
        return <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800">Private</Badge>;
      default:
        return null;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    // Here you would normally send the message to the backend
    console.log("Sending message:", newMessage);
    setNewMessage("");
  };

  const selectedConv = mockConversations.find(c => c.id === selectedConversation);

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto text-center py-12">
        <p className="text-gray-500">Please log in to view your messages.</p>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto px-3 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Messages</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Communicate with support, sellers, and administrators
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="col-span-1">
          <CardContent className="p-0">
            {/* Search */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="overflow-y-auto h-full">
              {mockConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    selectedConversation === conversation.id ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500" : ""
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">
                        {getInitials(conversation.otherUser)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                          {conversation.otherUser}
                        </h4>
                        {conversation.unreadCount > 0 && (
                          <Badge className="bg-blue-500 text-white text-xs w-5 h-5 flex items-center justify-center p-0">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mb-1">
                        {getConversationTypeBadge(conversation.type)}
                        {conversation.orderId && (
                          <span className="text-xs text-gray-500">#{conversation.orderId.slice(-6)}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {conversation.lastMessage}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {conversation.timestamp}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat View */}
        <Card className="col-span-3">
          <CardContent className="p-0 h-full flex flex-col">
            {selectedConv ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {getInitials(selectedConv.otherUser)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {selectedConv.otherUser}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {getConversationTypeBadge(selectedConv.type)}
                        {selectedConv.orderId && (
                          <span className="text-sm text-gray-500">Order #{selectedConv.orderId.slice(-6)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {mockMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.isOwn
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.isOwn ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                        }`}>
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      placeholder="Type your message…"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Select a conversation to start messaging
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}