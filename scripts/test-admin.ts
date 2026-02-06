
import { createAdminClient } from "@/lib/supabase/server";
import { config } from "dotenv";
config({ path: ".env.local" });

async function test() {
    console.log("Testing Admin Client...");
    try {
        const supabase = await createAdminClient();
        const { data, error } = await supabase.from('meetings').select('count').limit(1);

        if (error) {
            console.error("❌ Admin Client Failed:", error);
        } else {
            console.log("✅ Admin Client Success! DB Connection OK.");
        }
    } catch (e) {
        console.error("❌ Exception:", e);
    }
}

test();
