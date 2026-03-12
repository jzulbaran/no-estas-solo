-- =====================================================
-- "No Estás Solo" — Red de Oración Hispana Ontario
-- Schema de Base de Datos para Supabase
-- =====================================================

-- Extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: perfiles
-- =====================================================
CREATE TABLE IF NOT EXISTS perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  nombre_display TEXT DEFAULT 'Anónimo',
  ciudad TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para perfiles
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfiles visibles para todos" ON perfiles
  FOR SELECT USING (true);

CREATE POLICY "Usuarios pueden crear su perfil" ON perfiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar su perfil" ON perfiles
  FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- TABLA: peticiones
-- =====================================================
CREATE TABLE IF NOT EXISTS peticiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  autor_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  contenido TEXT NOT NULL CHECK (char_length(contenido) >= 10 AND char_length(contenido) <= 500),
  es_anonima BOOLEAN DEFAULT TRUE,
  ciudad TEXT,
  categoria TEXT DEFAULT 'otro' CHECK (categoria IN ('salud', 'familia', 'trabajo', 'fe', 'otro')),
  activa BOOLEAN DEFAULT TRUE,
  total_oraciones INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expira_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- RLS para peticiones
ALTER TABLE peticiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Peticiones activas visibles para todos" ON peticiones
  FOR SELECT USING (activa = true);

CREATE POLICY "Usuarios autenticados pueden crear peticiones" ON peticiones
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = autor_id);

CREATE POLICY "Autores pueden actualizar sus peticiones" ON peticiones
  FOR UPDATE USING (auth.uid() = autor_id);

-- =====================================================
-- TABLA: oraciones
-- =====================================================
CREATE TABLE IF NOT EXISTS oraciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  peticion_id UUID REFERENCES peticiones(id) ON DELETE CASCADE NOT NULL,
  intercesor_id UUID REFERENCES perfiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(peticion_id, intercesor_id)
);

-- RLS para oraciones
ALTER TABLE oraciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Oraciones visibles para todos" ON oraciones
  FOR SELECT USING (true);

CREATE POLICY "Usuarios autenticados pueden orar" ON oraciones
  FOR INSERT WITH CHECK (auth.uid() = intercesor_id);

-- =====================================================
-- FUNCIÓN: incrementar contador de oraciones
-- =====================================================
CREATE OR REPLACE FUNCTION incrementar_oracion(p_peticion_id UUID, p_intercesor_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Insertar la oración (falla si ya existe por el UNIQUE constraint)
  INSERT INTO oraciones (peticion_id, intercesor_id)
  VALUES (p_peticion_id, p_intercesor_id);

  -- Incrementar el contador en peticiones
  UPDATE peticiones
  SET total_oraciones = total_oraciones + 1
  WHERE id = p_peticion_id;

  -- Retornar el nuevo total
  SELECT json_build_object(
    'success', true,
    'total_oraciones', total_oraciones
  ) INTO v_result
  FROM peticiones
  WHERE id = p_peticion_id;

  RETURN v_result;
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'error', 'ya_oro');
END;
$$;

-- =====================================================
-- FUNCIÓN: estadísticas del día en Ontario
-- =====================================================
CREATE OR REPLACE FUNCTION estadisticas_ontario()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_oraciones_hoy INT;
  v_peticiones_activas INT;
  v_intercesores_hoy INT;
BEGIN
  SELECT COUNT(*) INTO v_oraciones_hoy
  FROM oraciones
  WHERE created_at >= CURRENT_DATE;

  SELECT COUNT(*) INTO v_peticiones_activas
  FROM peticiones
  WHERE activa = true AND expira_at > NOW();

  SELECT COUNT(DISTINCT intercesor_id) INTO v_intercesores_hoy
  FROM oraciones
  WHERE created_at >= CURRENT_DATE;

  RETURN json_build_object(
    'oraciones_hoy', v_oraciones_hoy,
    'peticiones_activas', v_peticiones_activas,
    'intercesores_hoy', v_intercesores_hoy
  );
END;
$$;

-- =====================================================
-- REALTIME: habilitar para actualizaciones en tiempo real
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE peticiones;
ALTER PUBLICATION supabase_realtime ADD TABLE oraciones;

-- =====================================================
-- TRIGGER: auto-crear perfil al registrarse
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre_display)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Anónimo')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- =====================================================
-- ÍNDICES para rendimiento
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_peticiones_activa ON peticiones(activa, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_peticiones_autor ON peticiones(autor_id);
CREATE INDEX IF NOT EXISTS idx_oraciones_peticion ON oraciones(peticion_id);
CREATE INDEX IF NOT EXISTS idx_oraciones_intercesor ON oraciones(intercesor_id);
CREATE INDEX IF NOT EXISTS idx_oraciones_fecha ON oraciones(created_at);
