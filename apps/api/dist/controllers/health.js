export const getHealth = (req, res, next) => {
    try {
        const responseData = {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
        res.status(200).json({
            success: true,
            data: responseData,
        });
    }
    catch (err) {
        next(err);
    }
};
