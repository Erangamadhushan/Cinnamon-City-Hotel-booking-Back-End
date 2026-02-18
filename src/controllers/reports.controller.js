import { Booking } from "../models/Booking.model.js";
import { Hotel } from "../models/Hotel.model.js";
import { Room } from "../models/Room.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getLastNMonthsLabels } from "../utils/NMonthsLabels.js";

export const summary = asyncHandler(async (req, res) => {
  const [hotelCount, roomCount, bookingCount] = await Promise.all([
    Hotel.countDocuments(),
    Room.countDocuments(),
    Booking.countDocuments(),
  ]);

  // Revenue: sum of all totalPrice for approved/completed/confirmed bookings
  const revenueAgg = await Booking.aggregate([
    {
      $match: {
        status: {
          $in: ["approved", "confirmed", "completed"],
        },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: {
          $sum: "$totalPrice",
        },
      },
    },
  ]);

  const revenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

  // Status distribution
  const statusAggregate = await Booking.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const statusCounts = Object.fromEntries(
    statusAggregate.map((item) => [item._id || "unknown", item.count]),
  );

  // Monthly revenue for last 6 months
  const months = getLastNMonthsLabels(6);
  const startDate = new Date(
    new Date().getFullYear(),
    new Date().getMonth() - (months.length - 1),
    1,
  );

  const monthlyRevenueAgg = await Booking.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
        },
      },
    },
    {
      $project: {
        year: {
          $year: "$createdAt",
        },
        month: {
          $month: "$createdAt",
        },
        totalPrice: 1,
        status: 1,
      },
    },
    {
      $group: {
        _id: {
          year: "$year",
          month: "$month",
        },
        bookings: {
          $count: {},
        },
        totalRevenue: {
          $sum: {
            $cond: [
              {
                $in: ["$status", ["approved", "confirmed", "completed"]],
              },
              "$totalPrice",
              0,
            ],
          },
        },
      },
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
      },
    },
  ]);

  const monthlyRevenue = new Map(
    monthlyRevenueAgg.map((item) => {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;
      return [key, item];
    }),
  );

  const monthlyRevenueData = months.map((m) => ({
    month: m.label,
    key: m.key,
    bookings: monthlyRevenue.get(m.key)?.bookings || 0,
    revenue: monthlyRevenue.get(m.key)?.totalRevenue || 0,
  }));

  // Top 5 hotels by revenue
  const topHotelsAgg = await Booking.aggregate([
    {
      $match: {
        status: {
          $in: ["approved", "confirmed", "completed"],
        },
      },
    },
    {
      $lookup: {
        from: "rooms",
        localField: "room",
        foreignField: "_id",
        as: "roomDetails",
      },
    },
    {
      $unwind: "$roomDetails",
    },
    {
      $lookup: {
        from: "hotels",
        localField: "roomDetails.hotel",
        foreignField: "_id",
        as: "hotelDetails",
      },
    },
    {
      $unwind: "$hotelDetails",
    },
    {
      $group: {
        _id: "$hotelDetails._id",
        name: { $first: "$hotelDetails.name" },
        revenue: {
          $sum: {
            $cond: [
              {
                $in: ["$status", ["approved", "confirmed", "completed"]],
              },
              "$totalPrice",
              0,
            ],
          },
        },
      },
    },
    {
      $sort: {
        revenue: -1,
      },
    },
    {
      $limit: 5,
    },
  ]);

  // Top 5 hotels by bookings
  const topHotelsByBookingsAgg = await Booking.aggregate([
    {
      $lookup: {
        from: "rooms",
        localField: "room",
        foreignField: "_id",
        as: "roomDetails",
      },
    },
    {
      $unwind: "$roomDetails",
    },
    {
      $lookup: {
        from: "hotels",
        localField: "roomDetails.hotel",
        foreignField: "_id",
        as: "hotelDetails",
      },
    },
    {
      $unwind: "$hotelDetails",
    },
    {
      $group: {
        _id: "$hotelDetails._id",
        name: { $first: "$hotelDetails.name" },
        bookings: { $count: {} },
      },
    },
    {
      $sort: {
        bookings: -1,
      },
    },
    {
      $limit: 5,
    },
  ]);

  // Hydrate hotel names
  const hotelIds = [
    ...new Set([
      ...topHotelsAgg.map((h) => h._id.toString()),
      ...topHotelsByBookingsAgg.map((h) => h._id.toString()),
    ]),
  ];
  const hotels = await Hotel.find({ _id: { $in: hotelIds } }).select("name");
  const hotelMap = new Map(hotels.map((h) => [h._id.toString(), h.name]));
  const topHotelsByBookings = topHotelsByBookingsAgg.map((h) => ({
    _id: h._id,
    name: hotelMap.get(h._id.toString()) || "Unknown Hotel",
    bookings: h.bookings,
  }));
  const topHotelsByRevenue = topHotelsAgg.map((h) => ({
    _id: h._id,
    name: hotelMap.get(h._id.toString()) || "Unknown Hotel",
    revenue: h.revenue,
  }));

  res.json(
    new ApiResponse(true, "Summary retrieved successfully", {
      hotelCount,
      roomCount,
      bookingCount,
      revenue,
      statusCounts,
      monthlyRevenue: monthlyRevenueData,
      topHotelsByRevenue,
      topHotelsByBookings,
    }),
  );
});
