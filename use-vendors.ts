import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertVendor } from "@shared/routes";

export function useVendors() {
  return useQuery({
    queryKey: [api.vendors.list.path],
    queryFn: async () => {
      const res = await fetch(api.vendors.list.path);
      if (!res.ok) throw new Error("Failed to fetch vendors");
      return api.vendors.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertVendor) => {
      // Validate with shared schema before sending
      const validated = api.vendors.create.input.parse(data);
      
      const res = await fetch(api.vendors.create.path, {
        method: api.vendors.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.vendors.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create vendor");
      }
      
      return api.vendors.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.vendors.list.path] });
    },
  });
}
