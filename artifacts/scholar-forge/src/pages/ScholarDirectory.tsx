import { useState } from "react";
import { Search, GraduationCap, BookOpen, User, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";
import { useSocket } from "@/contexts/SocketContext";
import { motion } from "framer-motion";

interface Scholar {
  id: string;
  name: string;
  email: string;
  institution?: string | null;
  researchInterests?: string | null;
  bio?: string | null;
  image?: string | null;
  role: string;
  isOnline: boolean;
  createdAt: string;
}

export default function ScholarDirectory() {
  const [search, setSearch] = useState("");
  const { data: scholars, loading } = useQuery<Scholar[]>("/api/users/directory");
  const { onlineUsers } = useSocket();

  const filtered = scholars?.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.institution?.toLowerCase().includes(q) ||
      s.researchInterests?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-semibold text-foreground">Scholar Directory</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Discover researchers and potential collaborators
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, institution, or research area..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : !filtered?.length ? (
        <div className="text-center py-20 text-muted-foreground">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No scholars found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((scholar, i) => {
            const isOnline = onlineUsers.has(scholar.id) || scholar.isOnline;
            return (
              <motion.div
                key={scholar.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card className="border-border hover:shadow-md transition-shadow">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        {scholar.image ? (
                          <img
                            src={scholar.image}
                            alt={scholar.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-lg font-semibold text-primary">
                              {scholar.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${isOnline ? "bg-green-500" : "bg-muted-foreground/30"}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-foreground truncate">
                            {scholar.name}
                          </p>
                          {scholar.role === "ADMIN" && (
                            <Badge variant="secondary" className="text-xs py-0">Admin</Badge>
                          )}
                        </div>
                        {scholar.institution && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                            <GraduationCap className="w-3 h-3 flex-shrink-0" />
                            {scholar.institution}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isOnline ? (
                            <span className="text-green-600 dark:text-green-400 font-medium">● Online</span>
                          ) : (
                            "Offline"
                          )}
                        </p>
                      </div>
                    </div>
                    {scholar.bio && (
                      <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{scholar.bio}</p>
                    )}
                    {scholar.researchInterests && (
                      <div className="mt-3 flex items-start gap-1.5">
                        <BookOpen className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {scholar.researchInterests}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
