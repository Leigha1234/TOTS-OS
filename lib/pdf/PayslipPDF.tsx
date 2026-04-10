import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

export default function PayslipPDF({
  employee,
  payroll,
  branding,
}: any) {
  const styles = StyleSheet.create({
    page: {
      padding: 30,
      fontFamily: "Helvetica",
    },
    header: {
      marginBottom: 20,
    },
    title: {
      fontSize: 18,
      color: branding.primaryColor,
    },
    section: {
      marginBottom: 10,
    },
  });

  return (
    <Document>
      <Page style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Payslip</Text>
        </View>

        <View style={styles.section}>
          <Text>Employee: {employee.name}</Text>
        </View>

        <View style={styles.section}>
          <Text>Gross Pay: £{payroll.gross_pay}</Text>
          <Text>Tax: £{payroll.tax}</Text>
          <Text>Net Pay: £{payroll.net_pay}</Text>
        </View>
      </Page>
    </Document>
  );
}