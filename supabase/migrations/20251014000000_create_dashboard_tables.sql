-- supabase/migrations/20251014000000_create_dashboard_tables.sql

CREATE TABLE "public"."menu_items" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
    "name" text NOT NULL,
    "price" integer NOT NULL,
    "tenant_id" uuid NOT NULL
);

ALTER TABLE "public"."menu_items" OWNER TO "postgres";
ALTER TABLE "public"."menu_items" ADD CONSTRAINT "menu_items_pkey" PRIMARY KEY (id);
-- I am assuming a tenants table exists with an id column, which is a reasonable assumption for a multi-tenant application.
ALTER TABLE "public"."menu_items" ADD CONSTRAINT "menu_items_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;


CREATE TABLE "public"."tables" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
    "name" text NOT NULL,
    "tenant_id" uuid NOT NULL
);

ALTER TABLE "public"."tables" OWNER TO "postgres";
ALTER TABLE "public"."tables" ADD CONSTRAINT "tables_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."tables" ADD CONSTRAINT "tables_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;


CREATE TABLE "public"."orders" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
    "table_id" uuid NOT NULL,
    "status" text NOT NULL,
    "tenant_id" uuid NOT NULL
);

ALTER TABLE "public"."orders" OWNER TO "postgres";
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_table_id_fkey" FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE RESTRICT;
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;


CREATE TABLE "public"."order_items" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
    "order_id" uuid NOT NULL,
    "menu_item_id" uuid NOT NULL,
    "quantity" integer NOT NULL,
    "tenant_id" uuid NOT NULL
);

ALTER TABLE "public"."order_items" OWNER TO "postgres";
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_menu_item_id_fkey" FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT;
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
