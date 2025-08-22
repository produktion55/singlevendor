import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";

export function Footer() {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { value: "light", label: "Light", color: "bg-white border-2 border-gray-300" },
    { value: "dark", label: "Dark", color: "bg-gray-900" },
    { value: "oled", label: "OLED", color: "bg-black" },
    { value: "colorful", label: "Colorful", color: "bg-gradient-to-r from-blue-500 to-purple-500" },
  ];

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* First Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">SecureMarket</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Premium digital products and services marketplace
              </p>
            </div>
            <div className="space-y-2">
              <a 
                href="#contact" 
                className="block text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Contact
              </a>
              <a 
                href="#faq" 
                className="block text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                FAQ
              </a>
            </div>
          </div>

          {/* Empty sections for future content */}
          <div></div>
          <div></div>
          <div></div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 mt-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            {/* Language Toggle */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Language:</span>
              <Select defaultValue="en">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Theme Toggle */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Theme:</span>
              <div className="flex space-x-1">
                {themeOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant="ghost"
                    size="sm"
                    className={`w-6 h-6 p-0 rounded ${option.color} ${
                      theme === option.value ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setTheme(option.value as any)}
                    title={option.label}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
