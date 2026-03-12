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

-- =====================================================
-- TABLA: grupos
-- =====================================================
CREATE TABLE IF NOT EXISTS grupos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creador_id        UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  nombre            TEXT NOT NULL CHECK (char_length(nombre) >= 3 AND char_length(nombre) <= 80),
  descripcion       TEXT CHECK (char_length(descripcion) <= 300),
  emoji_portada     TEXT DEFAULT '🙏',
  es_privado        BOOLEAN DEFAULT FALSE,
  codigo_invitacion TEXT UNIQUE DEFAULT SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8),
  total_miembros    INT DEFAULT 1,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Grupos públicos visibles para todos" ON grupos
  FOR SELECT USING (
    es_privado = FALSE
    OR EXISTS (
      SELECT 1 FROM grupo_miembros
      WHERE grupo_miembros.grupo_id = grupos.id
        AND grupo_miembros.perfil_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios autenticados pueden crear grupos" ON grupos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = creador_id);

CREATE POLICY "Admin del grupo puede actualizarlo" ON grupos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM grupo_miembros
      WHERE grupo_miembros.grupo_id = grupos.id
        AND grupo_miembros.perfil_id = auth.uid()
        AND grupo_miembros.rol = 'admin'
    )
  );

CREATE POLICY "Admin puede eliminar el grupo" ON grupos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM grupo_miembros
      WHERE grupo_miembros.grupo_id = grupos.id
        AND grupo_miembros.perfil_id = auth.uid()
        AND grupo_miembros.rol = 'admin'
    )
  );

-- =====================================================
-- TABLA: grupo_miembros
-- =====================================================
CREATE TABLE IF NOT EXISTS grupo_miembros (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id  UUID REFERENCES grupos(id) ON DELETE CASCADE NOT NULL,
  perfil_id UUID REFERENCES perfiles(id) ON DELETE CASCADE NOT NULL,
  rol       TEXT DEFAULT 'miembro' CHECK (rol IN ('admin', 'miembro')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(grupo_id, perfil_id)
);

ALTER TABLE grupo_miembros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Miembros pueden ver la lista del grupo" ON grupo_miembros
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM grupo_miembros gm2
      WHERE gm2.grupo_id = grupo_miembros.grupo_id
        AND gm2.perfil_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM grupos g
      WHERE g.id = grupo_miembros.grupo_id AND g.es_privado = FALSE
    )
  );

CREATE POLICY "Usuarios pueden unirse a grupos" ON grupo_miembros
  FOR INSERT WITH CHECK (auth.uid() = perfil_id);

CREATE POLICY "Admin puede remover miembros o miembro se va" ON grupo_miembros
  FOR DELETE USING (
    perfil_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM grupo_miembros admin_gm
      WHERE admin_gm.grupo_id = grupo_miembros.grupo_id
        AND admin_gm.perfil_id = auth.uid()
        AND admin_gm.rol = 'admin'
    )
  );

-- =====================================================
-- TABLA: grupo_peticiones
-- =====================================================
CREATE TABLE IF NOT EXISTS grupo_peticiones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id    UUID REFERENCES grupos(id) ON DELETE CASCADE NOT NULL,
  peticion_id UUID REFERENCES peticiones(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(grupo_id, peticion_id)
);

ALTER TABLE grupo_peticiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo miembros ven peticiones del grupo" ON grupo_peticiones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM grupo_miembros
      WHERE grupo_miembros.grupo_id = grupo_peticiones.grupo_id
        AND grupo_miembros.perfil_id = auth.uid()
    )
  );

CREATE POLICY "Miembros pueden publicar peticiones en el grupo" ON grupo_peticiones
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM grupo_miembros
      WHERE grupo_miembros.grupo_id = grupo_peticiones.grupo_id
        AND grupo_miembros.perfil_id = auth.uid()
    )
  );

-- =====================================================
-- FUNCIÓN: crear_grupo
-- =====================================================
CREATE OR REPLACE FUNCTION crear_grupo(
  p_nombre TEXT,
  p_descripcion TEXT DEFAULT NULL,
  p_emoji TEXT DEFAULT '🙏',
  p_es_privado BOOLEAN DEFAULT FALSE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_grupo_id UUID;
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'no_autenticado');
  END IF;

  INSERT INTO grupos (creador_id, nombre, descripcion, emoji_portada, es_privado)
  VALUES (v_user_id, p_nombre, p_descripcion, p_emoji, p_es_privado)
  RETURNING id INTO v_grupo_id;

  INSERT INTO grupo_miembros (grupo_id, perfil_id, rol)
  VALUES (v_grupo_id, v_user_id, 'admin');

  RETURN json_build_object('success', true, 'grupo_id', v_grupo_id);
END;
$$;

-- =====================================================
-- FUNCIÓN: unirse_a_grupo
-- =====================================================
CREATE OR REPLACE FUNCTION unirse_a_grupo(
  p_grupo_id UUID,
  p_codigo TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_grupo grupos%ROWTYPE;
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'no_autenticado');
  END IF;

  SELECT * INTO v_grupo FROM grupos WHERE id = p_grupo_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'grupo_no_encontrado');
  END IF;

  IF EXISTS (SELECT 1 FROM grupo_miembros WHERE grupo_id = p_grupo_id AND perfil_id = v_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'ya_es_miembro');
  END IF;

  IF v_grupo.es_privado AND (p_codigo IS NULL OR lower(trim(p_codigo)) != lower(v_grupo.codigo_invitacion)) THEN
    RETURN json_build_object('success', false, 'error', 'codigo_invalido');
  END IF;

  INSERT INTO grupo_miembros (grupo_id, perfil_id, rol) VALUES (p_grupo_id, v_user_id, 'miembro');
  UPDATE grupos SET total_miembros = total_miembros + 1 WHERE id = p_grupo_id;

  RETURN json_build_object('success', true, 'grupo_id', p_grupo_id);
END;
$$;

-- =====================================================
-- FUNCIÓN: unirse_por_codigo (sin conocer el grupo_id)
-- =====================================================
CREATE OR REPLACE FUNCTION unirse_por_codigo(p_codigo TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_grupo grupos%ROWTYPE;
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'no_autenticado');
  END IF;

  SELECT * INTO v_grupo FROM grupos WHERE lower(codigo_invitacion) = lower(trim(p_codigo));
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'codigo_invalido');
  END IF;

  IF EXISTS (SELECT 1 FROM grupo_miembros WHERE grupo_id = v_grupo.id AND perfil_id = v_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'ya_es_miembro', 'grupo_id', v_grupo.id);
  END IF;

  INSERT INTO grupo_miembros (grupo_id, perfil_id, rol) VALUES (v_grupo.id, v_user_id, 'miembro');
  UPDATE grupos SET total_miembros = total_miembros + 1 WHERE id = v_grupo.id;

  RETURN json_build_object('success', true, 'grupo_id', v_grupo.id, 'nombre', v_grupo.nombre);
END;
$$;

-- =====================================================
-- TABLA: devocionales
-- =====================================================
CREATE TABLE IF NOT EXISTS devocionales (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  autor_id       UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  titulo         TEXT NOT NULL CHECK (char_length(titulo) >= 5 AND char_length(titulo) <= 120),
  contenido      TEXT NOT NULL CHECK (char_length(contenido) >= 50 AND char_length(contenido) <= 3000),
  versiculo_ref  TEXT NOT NULL CHECK (char_length(versiculo_ref) <= 100),
  versiculo_texto TEXT NOT NULL CHECK (char_length(versiculo_texto) <= 500),
  categoria      TEXT DEFAULT 'reflexion' CHECK (
                   categoria IN ('reflexion', 'oracion', 'alabanza', 'promesa', 'otro')
                 ),
  grupo_id       UUID REFERENCES grupos(id) ON DELETE SET NULL,
  total_amenes   INT DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE devocionales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Devocionales visibles según contexto" ON devocionales
  FOR SELECT USING (
    grupo_id IS NULL
    OR EXISTS (
      SELECT 1 FROM grupo_miembros
      WHERE grupo_miembros.grupo_id = devocionales.grupo_id
        AND grupo_miembros.perfil_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios autenticados pueden publicar devocionales" ON devocionales
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = autor_id);

CREATE POLICY "Autores pueden eliminar sus devocionales" ON devocionales
  FOR DELETE USING (auth.uid() = autor_id);

-- =====================================================
-- TABLA: devocional_amenes
-- =====================================================
CREATE TABLE IF NOT EXISTS devocional_amenes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devocional_id UUID REFERENCES devocionales(id) ON DELETE CASCADE NOT NULL,
  perfil_id     UUID REFERENCES perfiles(id) ON DELETE CASCADE NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(devocional_id, perfil_id)
);

ALTER TABLE devocional_amenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Amenes visibles para todos" ON devocional_amenes
  FOR SELECT USING (true);

CREATE POLICY "Usuarios autenticados pueden decir Amén" ON devocional_amenes
  FOR INSERT WITH CHECK (auth.uid() = perfil_id);

-- =====================================================
-- FUNCIÓN: registrar_amen
-- =====================================================
CREATE OR REPLACE FUNCTION registrar_amen(
  p_devocional_id UUID,
  p_perfil_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  INSERT INTO devocional_amenes (devocional_id, perfil_id)
  VALUES (p_devocional_id, p_perfil_id);

  UPDATE devocionales SET total_amenes = total_amenes + 1 WHERE id = p_devocional_id;

  SELECT json_build_object('success', true, 'total_amenes', total_amenes)
  INTO v_result FROM devocionales WHERE id = p_devocional_id;

  RETURN v_result;
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'error', 'ya_dijo_amen');
END;
$$;

-- =====================================================
-- ÍNDICES adicionales
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_grupos_publicos ON grupos(es_privado, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_grupo_miembros_grupo ON grupo_miembros(grupo_id);
CREATE INDEX IF NOT EXISTS idx_grupo_miembros_perfil ON grupo_miembros(perfil_id);
CREATE INDEX IF NOT EXISTS idx_grupo_peticiones_grupo ON grupo_peticiones(grupo_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_devocionales_publicos ON devocionales(grupo_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_devocional_amenes_devocional ON devocional_amenes(devocional_id);
