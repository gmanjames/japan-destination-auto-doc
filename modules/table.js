const tableStartLocation = (index) => {
    return {
        index,
        segmentId: ""
    }
}

const tableCellLocation = (index, rowIndex) => {
    return {
        tableStartLocation: tableStartLocation(index),
        rowIndex,
        columnIndex: 0
    }
};

const insertTableRow = (insertBelow, index, rowIndex) => {
    return {
        insertTableRow: {
            tableCellLocation: tableCellLocation(index, rowIndex),
            insertBelow
        }
    }
};

module.exports = {
    insertTableRow
};