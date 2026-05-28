import { z } from "zod";

export const genesisSchema = z.object({
  country: z.string().min(1, "Pick a country!"),
  state: z.string().min(1, "Pick a state!"),
  gender: z.enum(["Male", "Female"]),
  first_name: z.string().min(2, "Name is too short!").max(20, "Name is too long!"),
  last_name: z.string().min(2, "Name is too short!").max(20, "Name is too long!"),
});

export type GenesisFormValues = z.infer<typeof genesisSchema>;