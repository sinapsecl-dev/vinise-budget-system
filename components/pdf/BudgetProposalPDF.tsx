import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#334155' },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40, alignItems: 'center' },
    documentInfo: { textAlign: 'right', fontSize: 8, color: '#64748b', textTransform: 'uppercase', lineHeight: 1.5 },
    title: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginVertical: 20, letterSpacing: 2 },
    clientInfo: { marginBottom: 30 },
    clientName: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
    introText: { marginBottom: 20, lineHeight: 1.5 },
    table: { width: '100%', marginBottom: 30 },
    tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#0f172a', paddingBottom: 5, marginBottom: 10 },
    col1: { width: '70%', fontWeight: 'bold' },
    col2: { width: '30%', textAlign: 'right', fontWeight: 'bold' },
    tableRow: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    tableRowTotal: { flexDirection: 'row', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#0f172a', backgroundColor: '#f8fafc', marginTop: 10 },
    footer: { position: 'absolute', bottom: 40, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
    footerText: { fontSize: 8, color: '#64748b' },
});

interface BudgetProposalPDFProps {
    state: any;
    calculations: any;
    currentUf: number;
    clientName: string;
    mode?: "general" | "detailed";
}

export const BudgetProposalPDF = ({ state, calculations, currentUf, clientName, mode = "general" }: BudgetProposalPDFProps) => {
    const currentDate = new Date().toLocaleDateString('es-CL');

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image src="/assets/vinise-logo.jpg" style={{ width: 160, height: 'auto', objectFit: 'contain' }} />
                    </View>
                    <View style={styles.documentInfo}>
                        <Text>EECC-00 REV.00</Text>
                        <Text>FECHA: {currentDate}</Text>
                        <Text>VALOR UF: ${currentUf.toLocaleString('es-CL')}</Text>
                        <Text>VALIDEZ: {state?.proposal_duration || ""}</Text>
                    </View>
                </View>

                <Text style={styles.title}>PRESUPUESTO</Text>

                <View style={styles.clientInfo}>
                    <Text style={{ color: '#64748b', marginBottom: 4 }}>A la atención de:</Text>
                    <Text style={styles.clientName}>{clientName || "Cliente"}</Text>
                    <Text>{state?.project_name || ""}</Text>
                    {state?.project_location ? <Text>{state.project_location}</Text> : null}
                </View>

                <Text style={styles.introText}>
                    Estimados señores, presentamos a continuación nuestra propuesta económica para la gestión técnica eléctrica del proyecto:
                </Text>

                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.col1}>Ítem / Partida</Text>
                        <Text style={styles.col2}>Monto (UF + IVA)</Text>
                    </View>

                    {state?.partitions?.map((part: any, idx: number) => {
                        const subtotalClp = calculations?.partitionTotals?.[part.id]?.subtotalClp || 0;
                        const subtotalUf = currentUf > 0 ? (subtotalClp / currentUf) : 0;
                        const subtotalUfIva = subtotalUf * 1.19;

                        return (
                            <View key={idx}>
                                {mode === "detailed" ? (
                                    <View style={{ marginTop: 15, marginBottom: 5 }}>
                                        <Text style={{ fontWeight: "bold", fontSize: 11, color: "#1e293b" }}>{part.number}. {part.name}</Text>
                                    </View>
                                ) : null}

                                {mode === "detailed" ? (
                                    <View style={{ marginBottom: 10 }}>
                                        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#cbd5e1', paddingBottom: 4, marginBottom: 4 }}>
                                            <Text style={{ width: '45%', fontSize: 8, fontWeight: 'bold', color: '#64748b' }}>Descripción</Text>
                                            <Text style={{ width: '10%', fontSize: 8, textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>Cant.</Text>
                                            <Text style={{ width: '10%', fontSize: 8, textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>Ud.</Text>
                                            <Text style={{ width: '15%', fontSize: 8, textAlign: 'right', fontWeight: 'bold', color: '#64748b' }}>V.Unit</Text>
                                            <Text style={{ width: '20%', fontSize: 8, textAlign: 'right', fontWeight: 'bold', color: '#64748b' }}>V.Total</Text>
                                        </View>
                                        {part?.lines?.sort((a: any, b: any) => a.sort_order - b.sort_order).map((line: any, lIdx: number) => {
                                            const lineTotalUf = calculations?.lineTotals?.[line.id]?.totalUf || 0;
                                            const lineTotalUfIva = lineTotalUf * 1.19;
                                            const qty = line.quantity || 0;
                                            const unitUfIva = qty > 0 ? (lineTotalUfIva / qty) : 0;
                                            return (
                                                <View key={lIdx} style={{ flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f8fafc' }}>
                                                    <Text style={{ width: '45%', fontSize: 8, color: '#334155' }}>{line.custom_description || "Item"}</Text>
                                                    <Text style={{ width: '10%', fontSize: 8, textAlign: 'center', color: '#334155' }}>{line.quantity}</Text>
                                                    <Text style={{ width: '10%', fontSize: 8, textAlign: 'center', color: '#334155' }}>{line.unit}</Text>
                                                    <Text style={{ width: '15%', fontSize: 8, textAlign: 'right', color: '#334155' }}>{(unitUfIva || 0).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                                    <Text style={{ width: '20%', fontSize: 8, textAlign: 'right', color: '#334155' }}>{(lineTotalUfIva || 0).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                                </View>
                                            );
                                        })}
                                        <View style={{ flexDirection: 'row', paddingVertical: 6, marginTop: 4, backgroundColor: '#f1f5f9', paddingHorizontal: 4, borderRadius: 4 }}>
                                            <Text style={{ width: '80%', fontSize: 9, fontWeight: 'bold', textAlign: 'right', paddingRight: 10, color: '#0f172a' }}>SUBTOTAL PARTIDA {part.number}</Text>
                                            <Text style={{ width: '20%', fontSize: 9, fontWeight: 'bold', textAlign: 'right', color: '#0f172a' }}>{(subtotalUfIva || 0).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.tableRow}>
                                        <Text style={styles.col1}>{part.number}. {part.name}</Text>
                                        <Text style={styles.col2}>{(subtotalUfIva || 0).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UF</Text>
                                    </View>
                                )}
                            </View>
                        )
                    })}

                    {calculations?.generalExpensesTotal > 0 && mode === "general" ? (
                        <View style={styles.tableRow}>
                            <Text style={styles.col1}>Gastos Generales Adicionales</Text>
                            <Text style={styles.col2}>{((currentUf > 0 ? (calculations.generalExpensesTotal / currentUf) : 0) * 1.19).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UF</Text>
                        </View>
                    ) : null}

                    {calculations?.generalExpensesTotal > 0 && mode === "detailed" ? (
                        <View style={{ marginTop: 15, marginBottom: 5 }}>
                            <Text style={{ fontWeight: "bold", fontSize: 11, color: "#1e293b" }}>Gastos Generales / Administrativos</Text>
                            {state?.general_expenses?.map((exp: any, eIdx: number) => {
                                const qty = exp.quantity || 1;
                                const val = exp.value_clp || 0;
                                const expTotalUf = currentUf > 0 ? ((qty * val) / currentUf) : 0;
                                const expTotalUfIva = expTotalUf * 1.19;
                                const expUnitUfIva = qty > 0 ? (expTotalUfIva / qty) : 0;
                                return (
                                    <View key={eIdx} style={{ flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f8fafc' }}>
                                        <Text style={{ width: '45%', fontSize: 8, color: '#334155' }}>{exp.description}</Text>
                                        <Text style={{ width: '10%', fontSize: 8, textAlign: 'center', color: '#334155' }}>{exp.quantity}</Text>
                                        <Text style={{ width: '10%', fontSize: 8, textAlign: 'center', color: '#334155' }}>Gl</Text>
                                        <Text style={{ width: '15%', fontSize: 8, textAlign: 'right', color: '#334155' }}>{(expUnitUfIva || 0).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                        <Text style={{ width: '20%', fontSize: 8, textAlign: 'right', color: '#334155' }}>{(expTotalUfIva || 0).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                    </View>
                                )
                            })}
                        </View>
                    ) : null}

                    <View style={styles.tableRowTotal}>
                        <Text style={styles.col1}>TOTAL (NETO + IVA)</Text>
                        <Text style={[styles.col2, { fontSize: 12, color: '#0f172a' }]}>{(calculations?.totalIvaInclusiveUf || 0).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UF</Text>
                    </View>
                </View>

                {state?.considerations ? (
                    <View style={{ marginTop: 20 }}>
                        <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Consideraciones:</Text>
                        <Text style={{ lineHeight: 1.5 }}>{state.considerations}</Text>
                    </View>
                ) : null}

                <View style={styles.footer}>
                    <View>
                        <Text style={{ fontSize: 8, fontStyle: 'italic', marginBottom: 4 }}>Valores expresados en UF + IVA (19%)</Text>
                        <Text style={styles.footerText}>VINISE Ingeniería Eléctrica SpA</Text>
                        <Text style={styles.footerText}>contacto@vinise.cl | +56 2 2345 6789</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};
