"""
Debug version of Ficha Técnica to identify the exact issue.
"""
from io import BytesIO
from django.http import HttpResponse
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from candidatos.models import UserProfile
from .data_collector import ReportDataCollector


def debug_ficha_tecnica(uid):
    """Debug version to identify the exact issue."""
    try:
        print(f"🔍 Starting debug for user {uid}")
        
        # Step 1: Get profile
        print("Step 1: Getting profile...")
        try:
            profile = UserProfile.objects.get(user__id=uid)
            print(f"✅ Profile found: {profile.user.first_name} {profile.user.last_name}")
        except Exception as e:
            print(f"❌ Error getting profile: {e}")
            raise
        
        # Step 2: Initialize data collector
        print("Step 2: Initializing data collector...")
        try:
            data_collector = ReportDataCollector(uid)
            print("✅ Data collector initialized")
        except Exception as e:
            print(f"❌ Error initializing data collector: {e}")
            raise
        
        # Step 3: Test each data collection method
        print("Step 3: Testing data collection methods...")
        
        try:
            print("  Testing evaluacion_diagnostica_data...")
            diagnostic_data = data_collector.get_evaluacion_diagnostica_data()
            print(f"  ✅ Diagnostic data: {len(diagnostic_data)} items")
        except Exception as e:
            print(f"  ❌ Error in diagnostic data: {e}")
            import traceback
            traceback.print_exc()
        
        try:
            print("  Testing comprehensive_data...")
            comprehensive_data = data_collector.get_comprehensive_data()
            print(f"  ✅ Comprehensive data: {type(comprehensive_data)}")
        except Exception as e:
            print(f"  ❌ Error in comprehensive data: {e}")
            import traceback
            traceback.print_exc()
        
        try:
            print("  Testing sis_protection_defense_data...")
            protection_data = data_collector.get_sis_protection_defense_data()
            print(f"  ✅ Protection data: {len(protection_data)} items")
        except Exception as e:
            print(f"  ❌ Error in protection data: {e}")
            import traceback
            traceback.print_exc()
        
        try:
            print("  Testing sis_medical_behavioral_data...")
            medical_data = data_collector.get_sis_medical_behavioral_data()
            print(f"  ✅ Medical data: {type(medical_data)}")
        except Exception as e:
            print(f"  ❌ Error in medical data: {e}")
            import traceback
            traceback.print_exc()
        
        # Step 4: Create simple PDF
        print("Step 4: Creating simple PDF...")
        try:
            buffer = BytesIO()
            doc = SimpleDocDocument(buffer, pagesize=letter)
            styles = getSampleStyleSheet()
            
            elements = []
            elements.append(Paragraph("DEBUG FICHA TÉCNICA", styles['Title']))
            elements.append(Paragraph(f"User ID: {uid}", styles['Normal']))
            elements.append(Paragraph(f"User Name: {profile.user.first_name} {profile.user.last_name}", styles['Normal']))
            elements.append(Spacer(1, 20))
            elements.append(Paragraph("✅ Debug completed successfully!", styles['Normal']))
            
            doc.build(elements)
            buffer.seek(0)
            
            response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="debug_ficha_tecnica_{uid}.pdf"'
            
            print("✅ Debug PDF created successfully!")
            return response
            
        except Exception as e:
            print(f"❌ Error creating PDF: {e}")
            import traceback
            traceback.print_exc()
            raise
        
    except Exception as e:
        print(f"❌ Overall debug failed: {e}")
        import traceback
        traceback.print_exc()
        raise


# Fix import
from reportlab.platypus import SimpleDocTemplate as SimpleDocDocument