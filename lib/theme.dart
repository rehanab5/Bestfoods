import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

Color _hsl(double h, double s, double l) =>
    HSLColor.fromAHSL(1, h, s / 100, l / 100).toColor();

class AppTheme {
  static ThemeData light() => _build(
        brightness: Brightness.light,
        background: _hsl(40, 33, 96),
        foreground: _hsl(20, 14, 14),
        card: _hsl(40, 30, 99),
        primary: _hsl(4, 80, 52),
        secondary: _hsl(40, 25, 90),
        muted: _hsl(40, 22, 92),
        mutedForeground: _hsl(20, 10, 42),
        accent: _hsl(105, 38, 40),
        border: _hsl(40, 18, 86),
      );

  static ThemeData dark() => _build(
        brightness: Brightness.dark,
        background: _hsl(20, 18, 7),
        foreground: _hsl(40, 30, 94),
        card: _hsl(20, 16, 11),
        primary: _hsl(4, 75, 56),
        secondary: _hsl(20, 14, 16),
        muted: _hsl(20, 14, 16),
        mutedForeground: _hsl(40, 10, 62),
        accent: _hsl(105, 38, 48),
        border: _hsl(20, 12, 20),
      );

  static ThemeData _build({
    required Brightness brightness,
    required Color background,
    required Color foreground,
    required Color card,
    required Color primary,
    required Color secondary,
    required Color muted,
    required Color mutedForeground,
    required Color accent,
    required Color border,
  }) {
    final scheme = ColorScheme(
      brightness: brightness,
      primary: primary,
      onPrimary: _hsl(40, 33, 98),
      secondary: secondary,
      onSecondary: foreground,
      tertiary: accent,
      onTertiary: _hsl(40, 33, 98),
      error: _hsl(0, 70, 50),
      onError: Colors.white,
      surface: card,
      onSurface: foreground,
      onSurfaceVariant: mutedForeground,
      outline: border,
      outlineVariant: border,
      surfaceContainerHighest: muted,
    );
    final base = ThemeData(brightness: brightness, colorScheme: scheme);
    return base.copyWith(
      scaffoldBackgroundColor: background,
      textTheme: GoogleFonts.plusJakartaSansTextTheme(base.textTheme)
          .apply(bodyColor: foreground, displayColor: foreground),
      appBarTheme: AppBarTheme(
        backgroundColor: background,
        foregroundColor: foreground,
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      cardTheme: CardThemeData(
        color: card,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: border),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        isDense: true,
        filled: true,
        fillColor: card,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: primary, width: 2),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(48, 48),
          shape: const StadiumBorder(),
          textStyle: const TextStyle(fontWeight: FontWeight.w700),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(48, 48),
          shape: const StadiumBorder(),
          side: BorderSide(color: border),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: background,
        indicatorColor: primary.withValues(alpha: 0.15),
      ),
      snackBarTheme: const SnackBarThemeData(behavior: SnackBarBehavior.floating),
    );
  }

  static TextStyle display(BuildContext context, {double size = 32, Color? color}) =>
      GoogleFonts.fraunces(
        fontSize: size,
        fontWeight: FontWeight.w600,
        color: color ?? Theme.of(context).colorScheme.onSurface,
        letterSpacing: -0.01 * size,
      );
}
