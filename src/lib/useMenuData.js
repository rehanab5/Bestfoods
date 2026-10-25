import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// Fetches menu items, deals, and locations from the `getMenu` backend function.
// Cached via react-query so all components share one request.
export function useMenuData() {
  return useQuery({
    queryKey: ["menuData"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getMenu", {});
      const d = res.data || res;
      return {
        items: d.items || [],
        deals: d.deals || [],
        locations: d.locations || [],
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}