-- 1. 現場（施工現場）管理テーブルの作成
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT '施工中',
    last_updated TIMESTAMPTZ DEFAULT now(),
    is_deleted BOOLEAN DEFAULT false
);

-- 2. 点検データテーブルの作成（存在しない場合）
CREATE TABLE IF NOT EXISTS inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    machine_type TEXT NOT NULL,
    model_type TEXT NOT NULL,
    machine_id TEXT NOT NULL,
    inspection_date DATE NOT NULL,
    operating_hours NUMERIC NOT NULL,
    inspector_name TEXT,
    remarks TEXT,
    repairs TEXT,
    statuses JSONB NOT NULL,
    line_user_id TEXT,
    is_deleted BOOLEAN DEFAULT false
);

-- 3. 【重要】既存の点検データテーブルに「現場ID」カラムを追加（すでにある場合は無視される）
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inspections' AND column_name='site_id') THEN
        ALTER TABLE inspections ADD COLUMN site_id UUID REFERENCES sites(id);
    END IF;
END $$;

-- 4. インデックス作成
CREATE INDEX IF NOT EXISTS idx_inspections_site_id ON inspections(site_id);
CREATE INDEX IF NOT EXISTS idx_inspections_machine_id ON inspections(machine_id);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_sites_name ON sites(name);

-- 5. RLS設定
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

-- 既存の古いポリシーがある場合に備えて一度削除（エラー回避）
DROP POLICY IF EXISTS "Allow public access" ON inspections;
DROP POLICY IF EXISTS "Allow public access to sites" ON sites;
DROP POLICY IF EXISTS "Allow public access to inspections" ON inspections;

CREATE POLICY "Allow public access to sites" ON sites FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to inspections" ON inspections FOR ALL USING (true) WITH CHECK (true);
