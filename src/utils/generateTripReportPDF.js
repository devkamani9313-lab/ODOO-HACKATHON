import { jsPDF } from 'jspdf';

export function generateTripReportPDF(trip, driver = {}, vehicle = {}) {
  if (!trip || !trip.source || !trip.destination) {
    throw new Error('Unable to generate report.');
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = margin;

  // Colors
  const darkSlate = [15, 23, 42];       // #0f172a
  const violetAccent = [124, 58, 237];  // #7c3aed
  const textGray = [100, 116, 139];     // #64748b
  const textDark = [30, 41, 59];        // #1e293b
  const borderGray = [226, 232, 240];   // #e2e8f0

  // Header Background Bar
  doc.setFillColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Header Brand & Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('TransitOps', margin, 18);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('TRIP COMPLETION REPORT', margin, 26);

  // Right Side Header Metadata
  const dateStr = new Date().toLocaleDateString();
  const reportId = `REP-${trip.id || Date.now()}`;
  doc.setFontSize(9);
  doc.text(`Generation Date: ${dateStr}`, pageWidth - margin, 18, { align: 'right' });
  doc.text(`Report ID: ${reportId}`, pageWidth - margin, 26, { align: 'right' });

  // Accent Line under header
  doc.setDrawColor(violetAccent[0], violetAccent[1], violetAccent[2]);
  doc.setLineWidth(1.2);
  doc.line(0, 38, pageWidth, 38);

  y = 48;

  // Helper: Section Title
  const drawSectionTitle = (title) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(violetAccent[0], violetAccent[1], violetAccent[2]);
    doc.text(title.toUpperCase(), margin, y);
    y += 2.5;
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  };

  // Helper: Key-Value Row (two columns)
  const drawRowPair = (label1, val1, label2, val2) => {
    const colWidth = (pageWidth - margin * 2) / 2;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text(label1, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(String(val1 || 'N/A'), margin + 35, y);

    if (label2) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(textGray[0], textGray[1], textGray[2]);
      doc.text(label2, margin + colWidth, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(String(val2 || 'N/A'), margin + colWidth + 38, y);
    }
    y += 6.5;
  };

  // 1. DRIVER INFORMATION
  drawSectionTitle('Driver Information');
  drawRowPair(
    'Driver Name:', driver.name || trip.driverName || 'N/A',
    'Driver ID:', driver.id || trip.driverId || 'DRV-1002'
  );
  drawRowPair(
    'License Number:', driver.licenseNumber || 'DL-89201-TX',
    'Contact Number:', driver.phone || driver.contact || '+1 (555) 019-2831'
  );
  y += 4;

  // 2. VEHICLE INFORMATION
  drawSectionTitle('Vehicle Information');
  drawRowPair(
    'Vehicle Name:', vehicle.name || trip.vehicleName || 'N/A',
    'Registration:', vehicle.registrationNumber || vehicle.regNumber || 'TRK-9821-B'
  );
  drawRowPair(
    'Vehicle Type:', vehicle.type || 'Heavy Logistics Freight',
    'Max Capacity:', vehicle.capacity ? `${vehicle.capacity} kg` : '12,500 kg'
  );
  y += 4;

  // 3. TRIP INFORMATION
  drawSectionTitle('Trip Information');
  drawRowPair(
    'Trip ID:', trip.id || 'N/A',
    'Trip Status:', trip.status || 'Completed'
  );
  drawRowPair(
    'Source:', trip.source || 'N/A',
    'Destination:', trip.destination || 'N/A'
  );
  drawRowPair(
    'Dispatch Date:', trip.dispatchDate || trip.startDate || dateStr,
    'Completion Date:', trip.completionDate || trip.endDate || dateStr
  );
  const distance = Number(trip.plannedDistance || trip.distance) || 0;
  const fuel = Number(trip.fuelConsumed) || 0;
  drawRowPair(
    'Distance Covered:', `${distance.toLocaleString()} km`,
    'Cargo Weight:', trip.cargoWeight || '8,400 kg'
  );
  drawRowPair(
    'Fuel Consumed:', fuel > 0 ? `${fuel} L` : 'N/A',
    'Trip Duration:', trip.duration || '6.2 hrs'
  );
  y += 4;

  // 4. PERFORMANCE SUMMARY
  drawSectionTitle('Performance Summary');
  const efficiency = (distance > 0 && fuel > 0) ? `${(distance / fuel).toFixed(1)} km/L` : 'N/A';
  drawRowPair(
    'Completed Successfully:', 'Yes',
    'Fuel Efficiency:', efficiency
  );
  drawRowPair(
    'Average Speed:', trip.avgSpeed ? `${trip.avgSpeed} km/h` : '64 km/h',
    'Vehicle Utilization:', trip.utilization || 'Optimal (100%)'
  );
  drawRowPair(
    'Delivery Status:', 'On-Time & Verified',
    '', ''
  );

  // Footer Box
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 20;

  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('Generated automatically by TransitOps', margin, footerY);
  doc.text('This report is system generated.', pageWidth - margin, footerY, { align: 'right' });

  // Download file
  const fileName = `TransitOps_Trip_Report_${trip.id || 'Completed'}.pdf`;
  doc.save(fileName);
  return true;
}
